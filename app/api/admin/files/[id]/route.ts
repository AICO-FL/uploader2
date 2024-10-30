import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { unlink } from "fs/promises"
import { join } from "path"

export const dynamic = "force-dynamic"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const database = db()

    // Get file info before deletion
    const file = database.prepare(`
      SELECT path
      FROM files
      WHERE id = ?
    `).get(params.id) as { path: string } | undefined

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
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
    console.error("Delete file error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}