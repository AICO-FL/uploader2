import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { unlink } from "fs/promises"
import { join } from "path"
import type { Folder, File } from "@/types/database"

interface FolderWithJsonFiles extends Omit<Folder, 'files'> {
  files: string // JSON string of files
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const database = db()
    const folder = database.prepare(`
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
      WHERE f.id = ? AND f.user_id = ?
      GROUP BY f.id
    `).get(params.id, auth.id) as FolderWithJsonFiles | undefined

    if (!folder) {
      return NextResponse.json(
        { error: "フォルダーが見つかりません" },
        { status: 404 }
      )
    }

    // Parse the JSON string of files
    const files = JSON.parse(folder.files) as File[]
    
    // Remove null entries if there are no files
    const cleanedFolder = {
      ...folder,
      files: files[0] === null ? [] : files
    }

    return NextResponse.json(cleanedFolder)
  } catch (error) {
    console.error("Get folder error:", error)
    return NextResponse.json(
      { error: "フォルダーの取得に失敗しました" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const database = db()

    // Get files in the folder before deletion
    const files = database.prepare(`
      SELECT path
      FROM files
      WHERE folder_id = ? AND user_id = ?
    `).all(params.id, auth.id) as { path: string }[]

    // Start transaction
    database.prepare('BEGIN TRANSACTION').run()

    try {
      // Delete files from database
      database.prepare(`
        DELETE FROM files
        WHERE folder_id = ? AND user_id = ?
      `).run(params.id, auth.id)

      // Delete folder
      const result = database.prepare(`
        DELETE FROM folders
        WHERE id = ? AND user_id = ?
        RETURNING id
      `).get(params.id, auth.id)

      if (!result) {
        throw new Error("Folder not found")
      }

      // Commit transaction
      database.prepare('COMMIT').run()

      // Delete physical files
      for (const file of files) {
        try {
          const filePath = join(process.cwd(), "uploads", file.path)
          await unlink(filePath)
        } catch (error) {
          console.error(`Failed to delete file: ${file.path}`, error)
        }
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      // Rollback transaction on error
      database.prepare('ROLLBACK').run()
      throw error
    }
  } catch (error) {
    console.error("Delete folder error:", error)
    return NextResponse.json(
      { error: "フォルダーの削除に失敗しました" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    const database = db()

    const folder = database.prepare(`
      UPDATE folders
      SET name = ?
      WHERE id = ? AND user_id = ?
      RETURNING *
    `).get(name, params.id, auth.id) as Folder | undefined

    if (!folder) {
      return NextResponse.json(
        { error: "フォルダーが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json(folder)
  } catch (error) {
    console.error("Update folder error:", error)
    return NextResponse.json(
      { error: "フォルダーの更新に失敗しました" },
      { status: 500 }
    )
  }
}