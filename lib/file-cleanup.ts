import { db } from "@/lib/db"
import { unlink } from "fs/promises"
import { join } from "path"
import type { File } from "@/types/database"

export async function cleanupExpiredFiles() {
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

    return expiredFiles.length
  } catch (error) {
    console.error("Failed to cleanup expired files:", error)
    return 0
  }
}