import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { fileIds, folderId } = await request.json()
    const database = db()

    // Verify file ownership
    const files = database.prepare(`
      SELECT id
      FROM files
      WHERE id IN (${fileIds.map(() => '?').join(',')})
      AND user_id = ?
    `).all(...fileIds, auth.id)

    if (files.length !== fileIds.length) {
      return NextResponse.json(
        { error: "一部のファイルが見つからないか、移動権限がありません" },
        { status: 404 }
      )
    }

    // Verify folder ownership if moving to a folder
    if (folderId) {
      const folder = database.prepare(`
        SELECT id
        FROM folders
        WHERE id = ? AND user_id = ?
      `).get(folderId, auth.id)

      if (!folder) {
        return NextResponse.json(
          { error: "フォルダーが見つからないか、アクセス権限がありません" },
          { status: 404 }
        )
      }
    }

    // Move files
    database.prepare(`
      UPDATE files
      SET folder_id = ?
      WHERE id IN (${fileIds.map(() => '?').join(',')})
      AND user_id = ?
    `).run(folderId, ...fileIds, auth.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Move files error:", error)
    return NextResponse.json(
      { error: "ファイルの移動に失敗しました" },
      { status: 500 }
    )
  }
}