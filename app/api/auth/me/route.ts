import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await verifyAuth()
    
    if (!auth) {
      return NextResponse.json(null)
    }

    const database = db()
    const user = database.prepare(`
      SELECT email, name, role
      FROM users
      WHERE id = ?
    `).get(auth.id) as { email: string | null, name: string | null, role: string }

    // Ensure all values are serializable
    return NextResponse.json({
      email: user.email || null,
      name: user.name || null,
      role: user.role
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}