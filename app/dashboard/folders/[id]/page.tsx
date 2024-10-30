import { Metadata } from "next"
import { FolderView } from "@/components/folder-view"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Folder View",
  description: "View folder contents"
}

export async function generateStaticParams() {
  const database = db()
  const folders = database.prepare(`
    SELECT id FROM folders
  `).all() as { id: string }[]

  return folders.map((folder) => ({
    id: folder.id,
  }))
}

export default function FolderPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto py-8">
      <FolderView folderId={params.id} />
    </div>
  )
}