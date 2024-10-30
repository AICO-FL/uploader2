import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { createReadStream } from "fs"
import { join } from "path"
import { unlink } from "fs/promises"
import type { File } from "@/types/database"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const database = db()
  try {
    const file = database.prepare(`
      SELECT name, path, mime_type
      FROM files
      WHERE id = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(params.id) as Pick<File, 'name' | 'path' | 'mime_type'> | undefined

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      )
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const database = db()
  try {
    const auth = await verifyAuth(request)
    
    // ゲストユーザーの場合は、ファイルの所有者がnullのファイルのみ削除可能
    const file = database.prepare(`
      SELECT path
      FROM files
      WHERE id = ? AND (
        user_id IS NULL OR 
        (? IS NOT NULL AND (user_id = ? OR ? = 'ADMIN'))
      )
    `).get(params.id, auth?.id, auth?.id, auth?.role) as Pick<File, 'path'> | undefined

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つからないか、削除権限がありません" },
        { status: 404 }
      )
    }

    // Delete from database
    database.prepare(`
      DELETE FROM files
      WHERE id = ?
    `).run(params.id)

    // Delete physical file
    const filePath = join(process.cwd(), "uploads", file.path)
    await unlink(filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { error: "ファイルの削除に失敗しました" },
      { status: 500 }
    )
  }
}