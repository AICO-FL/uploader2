import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import type { File } from "@/types/database"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const database = db()
    const files = database.prepare(`
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `).all() as (File & { user_name: string | null, user_email: string | null })[]

    return NextResponse.json(files.map(file => ({
      ...file,
      user: file.user_id ? {
        name: file.user_name,
        email: file.user_email
      } : null
    })))
  } catch (error) {
    console.error("Get files error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}