import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { createId } from "@paralleldrive/cuid2"
import bcrypt from "bcryptjs"
import type { File, Folder } from "@/types/database"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function generateUniqueShareUrl(): Promise<string> {
  const database = db()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const shareUrl = createId()
    
    // Check if URL exists in either files or folders
    const existing = database.prepare(`
      SELECT COUNT(*) as count
      FROM (
        SELECT share_url FROM files WHERE share_url = ?
        UNION ALL
        SELECT share_url FROM folders WHERE share_url = ?
      )
    `).get(shareUrl, shareUrl) as { count: number }

    if (existing.count === 0) {
      return shareUrl
    }

    attempts++
  }

  throw new Error("Failed to generate unique share URL")
}

export async function POST(request: Request) {
  const database = db()
  
  try {
    const auth = await verifyAuth()
    const { id, type, password, expiresIn, isGlobal, fileIds } = await request.json()

    let sharePassword = null
    if (password) {
      sharePassword = await bcrypt.hash(password, 10)
    }

    let expiresAt = null
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000)
    }

    // Generate unique share URL before starting transaction
    const shareUrl = await generateUniqueShareUrl()

    // Start transaction
    database.prepare('BEGIN TRANSACTION').run()

    try {
      if (type === "file") {
        if (isGlobal && Array.isArray(fileIds) && fileIds.length > 0) {
          // For guest users, first verify files exist and are accessible
          const placeholders = fileIds.map(() => "?").join(",")
          const files = database.prepare(`
            SELECT id
            FROM files
            WHERE id IN (${placeholders})
            AND user_id IS NULL
            AND (expires_at IS NULL OR expires_at > datetime('now'))
          `).all(...fileIds) as { id: string }[]

          if (files.length === 0) {
            throw new Error("No valid files found")
          }

          // Update all valid files with the same share URL
          const validFileIds = files.map(f => f.id)
          const updatePlaceholders = validFileIds.map(() => "?").join(",")
          
          database.prepare(`
            UPDATE files 
            SET share_url = ?, share_password = ?, expires_at = ?
            WHERE id IN (${updatePlaceholders})
          `).run(shareUrl, sharePassword, expiresAt?.toISOString(), ...validFileIds)
        } else {
          // For regular users, update single file
          const file = database.prepare(`
            UPDATE files 
            SET share_url = ?, share_password = ?, expires_at = ?
            WHERE id = ? AND (user_id = ? OR user_id IS NULL)
            RETURNING *
          `).get(shareUrl, sharePassword, expiresAt?.toISOString(), id, auth?.id) as File | undefined

          if (!file) {
            throw new Error("File not found or access denied")
          }
        }
      } else if (type === "folder" && auth) {
        const folder = database.prepare(`
          UPDATE folders
          SET share_url = ?, share_password = ?
          WHERE id = ? AND user_id = ?
          RETURNING *
        `).get(shareUrl, sharePassword, id, auth.id) as Folder | undefined

        if (!folder) {
          throw new Error("Folder not found or access denied")
        }
      } else {
        throw new Error("Invalid share type")
      }

      // Commit transaction
      database.prepare('COMMIT').run()

      return NextResponse.json({
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareUrl}`
      })
    } catch (error) {
      // Rollback on error
      database.prepare('ROLLBACK').run()
      throw error
    }
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "共有リンクの作成に失敗しました" },
      { status: 500 }
    )
  }
}