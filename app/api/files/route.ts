import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { createId } from "@paralleldrive/cuid2"

export const dynamic = "force-dynamic"

const UPLOAD_DIR = join(process.cwd(), "uploads")

export async function POST(request: Request) {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })

    const formData = await request.formData()
    const uploadFiles = formData.getAll("files") as File[]
    const auth = await verifyAuth()
    
    const isGuest = !auth
    const maxFiles = isGuest ? 5 : 10
    const maxSize = isGuest ? 100 * 1024 * 1024 : 4 * 1024 * 1024 * 1024
    
    if (uploadFiles.length > maxFiles) {
      return NextResponse.json(
        { error: `最大${maxFiles}個までアップロードできます` },
        { status: 400 }
      )
    }

    const uploadedFiles = []
    const database = db()

    for (const file of uploadFiles) {
      if (!file || !(file instanceof File)) {
        continue
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `ファイルサイズが制限を超えています (最大 ${maxSize / (1024 * 1024)}MB)` },
          { status: 400 }
        )
      }

      const id = createId()
      const ext = file.name.split(".").pop()
      const fileName = `${id}.${ext}`
      const filePath = join(UPLOAD_DIR, fileName)
      
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, buffer)

      const expiresAt = isGuest ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null

      const fileRecord = database.prepare(`
        INSERT INTO files (id, name, path, size, mime_type, user_id, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id, name, size, mime_type, created_at, download_count
      `).get(
        id,
        file.name,
        fileName,
        file.size,
        file.type,
        auth?.id || null,
        expiresAt?.toISOString()
      )

      uploadedFiles.push(fileRecord)
    }

    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    )
  }
}