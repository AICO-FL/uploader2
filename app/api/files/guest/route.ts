import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { File } from "@/types/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get("ids")?.split(",") || []

    if (ids.length === 0) {
      return NextResponse.json({ files: [] })
    }

    const database = db()
    const placeholders = ids.map(() => "?").join(",")
    
    const files = database.prepare(`
      SELECT id, name, size, mime_type, created_at, download_count, share_url
      FROM files
      WHERE id IN (${placeholders})
        AND user_id IS NULL
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC
    `).all(...ids) as File[]

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Get guest files error:", error)
    return NextResponse.json(
      { error: "ファイル一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}