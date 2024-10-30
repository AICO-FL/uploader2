import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"
import { createId } from "@paralleldrive/cuid2"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/lib/auth"

interface DbUser {
  id: string
  username: string
  email: string | null
  name: string | null
  role: UserRole
}

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
    const users = database.prepare(`
      SELECT id, username, email, name, role
      FROM users
      WHERE role = 'USER'
    `).all() as DbUser[]

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email, name, password } = await request.json()
    const id = createId()
    const username = email.split('@')[0] // Generate username from email
    const passwordHash = await bcrypt.hash(password, 10)

    const database = db()
    const user = database.prepare(`
      INSERT INTO users (id, username, email, name, password, role)
      VALUES (?, ?, ?, ?, ?, 'USER')
      RETURNING id, username, email, name, role
    `).get(id, username, email, name, passwordHash) as DbUser

    return NextResponse.json(user)
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}