import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createReadStream } from "fs"
import { join } from "path"
import { cookies } from "next/headers"
import type { File } from "@/types/database"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const database = db()
    const file = database.prepare(`
      SELECT f.name, f.path, f.mime_type, f.share_url, f.share_password
      FROM files f
      WHERE f.id = ?
        AND (f.expires_at IS NULL OR f.expires_at > datetime('now'))
    `).get(params.id) as Pick<File, 'name' | 'path' | 'mime_type' | 'share_url' | 'share_password'> | undefined

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      )
    }

    // 共有リンクでアクセスされている場合、認証を確認
    if (file.share_url && file.share_password) {
      const authCookie = cookies().get(`share_auth_${file.share_url}`)
      if (!authCookie) {
        return NextResponse.json(
          { error: "認証が必要です" },
          { status: 401 }
        )
      }
    }

    // Update download count
    database.prepare(`
      UPDATE files
      SET download_count = download_count + 1
      WHERE id = ?
    `).run(params.id)

    const filePath = join(process.cwd(), "uploads", file.path)
    const fileStream = createReadStream(filePath)

    return new NextResponse(fileStream as any, {
      headers: {
        "Content-Type": file.mime_type || 'application/octet-stream',
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "ファイルのダウンロードに失敗しました" },
      { status: 500 }
    )
  }
}