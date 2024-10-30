import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { ShareAuth } from "@/components/share-auth"
import { SharedContent } from "@/components/shared-content"
import type { File, Folder } from "@/types/database"
import type { Metadata } from 'next'

interface SharePageProps {
  params: {
    id: string
  }
}

interface FolderWithFiles extends Folder {
  files: File[]
}

async function getSettings() {
  const database = db()
  const settings = database.prepare(`
    SELECT site_name
    FROM settings
    WHERE id = 1
  `).get() as { site_name: string } || {
    site_name: "File Uploader"
  }
  return settings
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  
  return {
    title: `共有ファイル - ${settings.site_name}`,
    description: 'Shared file or folder',
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = params
  const database = db()
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get(`share_auth_${id}`)?.value === "true"

  // Try to find shared files with this URL
  const files = database.prepare(`
    SELECT *
    FROM files
    WHERE share_url = ?
    AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).all(id) as File[]

  // If no files found, try to find a shared folder with its files
  const folder = files.length === 0 ? database.prepare(`
    SELECT f.*, json_group_array(
      CASE WHEN fl.id IS NOT NULL THEN
        json_object(
          'id', fl.id,
          'name', fl.name,
          'size', fl.size,
          'mime_type', fl.mime_type,
          'created_at', fl.created_at
        )
      ELSE NULL END
    ) as files
    FROM folders f
    LEFT JOIN files fl ON f.id = fl.folder_id
    WHERE f.share_url = ?
    GROUP BY f.id
  `).get(id) as (Omit<Folder, 'files'> & { files: string }) | undefined : undefined

  if (files.length === 0 && !folder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">共有リンクが見つかりません</h1>
          <p className="text-muted-foreground">
            URLを確認するか、共有者に連絡してください
          </p>
        </div>
      </div>
    )
  }

  let content: File[] | FolderWithFiles
  let type: "files" | "folder"

  if (folder) {
    // Parse the JSON string of files
    const folderFiles = JSON.parse(folder.files) as File[]
    content = {
      ...folder,
      files: folderFiles[0] === null ? [] : folderFiles
    }
    type = "folder"
  } else {
    content = files
    type = "files"
  }

  // パスワードが設定されていて、認証されていない場合は認証画面を表示
  const hasPassword = type === "folder" 
    ? (content as FolderWithFiles).share_password
    : files[0].share_password

  if (hasPassword && !isAuthenticated) {
    return <ShareAuth id={id} type={type} />
  }

  return <SharedContent content={content} type={type} />
}