import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { unlink } from "fs/promises"
import { join } from "path"
import type { File } from "@/types/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const database = db()
    
    // Get expired files
    const expiredFiles = database.prepare(`
      SELECT id, path
      FROM files
      WHERE expires_at IS NOT NULL
        AND expires_at < datetime('now')
    `).all() as Pick<File, 'id' | 'path'>[]

    // Delete expired files
    for (const file of expiredFiles) {
      try {
        // Delete from database
        database.prepare(`
          DELETE FROM files
          WHERE id = ?
        `).run(file.id)

        // Delete physical file
        const filePath = join(process.cwd(), "uploads", file.path)
        await unlink(filePath)
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: expiredFiles.length
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { error: "期限切れファイルの削除に失敗しました" },
      { status: 500 }
    )
  }
}