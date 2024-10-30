import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import type { Folder } from "@/types/database"

export const dynamic = "force-dynamic"

interface FolderWithCount extends Folder {
  file_count: number
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    const database = db()

    // 同じ名前のフォルダーが存在するかチェック
    const existingFolder = database.prepare(`
      SELECT id
      FROM folders
      WHERE user_id = ? AND name = ?
    `).get(auth.id, name)

    if (existingFolder) {
      return NextResponse.json(
        { error: "同じ名前のフォルダーが既に存在します" },
        { status: 400 }
      )
    }

    const id = createId()
    const folder = database.prepare(`
      INSERT INTO folders (id, name, user_id)
      VALUES (?, ?, ?)
      RETURNING *
    `).get(id, name, auth.id) as Folder

    return NextResponse.json(folder)
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const database = db()
    const folders = database.prepare(`
      SELECT f.*, COUNT(fl.id) as file_count
      FROM folders f
      LEFT JOIN files fl ON f.id = fl.folder_id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `).all(auth.id) as FolderWithCount[]

    if (!folders) {
      return NextResponse.json([])
    }

    return NextResponse.json(folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      user_id: folder.user_id,
      share_url: folder.share_url,
      share_password: folder.share_password,
      created_at: folder.created_at,
      _count: { files: folder.file_count }
    })))
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}