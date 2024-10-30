import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { signToken } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"

interface DbUser {
  id: string
  username: string
  password: string
  role: UserRole
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const database = db()

    // First try exact username match
    let user = database.prepare(`
      SELECT id, username, password, role
      FROM users 
      WHERE username = ?
    `).get(username) as DbUser | undefined

    // If not found, try email match
    if (!user) {
      user = database.prepare(`
        SELECT id, username, password, role
        FROM users 
        WHERE email = ?
      `).get(username) as DbUser | undefined
    }

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 }
      )
    }

    await signToken({ 
      id: user.id, 
      username: user.username,
      role: user.role
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    )
  }
}