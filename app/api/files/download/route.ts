import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { join } from "path"
import { createReadStream } from "fs"
import archiver from "archiver"
import { Readable } from "stream"
import { PassThrough } from "stream"
import type { File } from "@/types/database"

interface FileDownload {
  id: string
  name: string
  path: string
}

export async function POST(request: NextRequest) {
  try {
    const { fileIds } = await request.json()
    const auth = await verifyAuth()
    const database = db()

    // Verify file access
    const files = database.prepare(`
      SELECT id, name, path
      FROM files
      WHERE id IN (${fileIds.map(() => '?').join(',')})
      AND (
        user_id ${auth ? '= ?' : 'IS NULL'}
        AND (expires_at IS NULL OR expires_at > datetime('now'))
      )
    `).all(...[...fileIds, ...(auth ? [auth.id] : [])]) as FileDownload[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      )
    }

    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 5 }
    })

    const passThrough = new PassThrough()
    archive.pipe(passThrough)

    // Add files to archive
    for (const file of files) {
      const filePath = join(process.cwd(), "uploads", file.path)
      archive.append(createReadStream(filePath), { name: file.name })

      // Update download count
      database.prepare(`
        UPDATE files
        SET download_count = download_count + 1
        WHERE id = ?
      `).run(file.id)
    }

    await archive.finalize()

    // Convert PassThrough to ReadableStream
    const stream = Readable.from(passThrough)

    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=files.zip"
      }
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json(
      { error: "ファイルのダウンロードに失敗しました" },
      { status: 500 }
    )
  }
}