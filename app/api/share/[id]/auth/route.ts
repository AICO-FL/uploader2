import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

interface ShareItem {
  id: string
  share_password: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await request.json()
    const database = db()

    // Try to find file or folder with this share URL
    const file = database.prepare(`
      SELECT id, share_password
      FROM files
      WHERE share_url = ?
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(params.id) as ShareItem | undefined

    const folder = !file ? database.prepare(`
      SELECT id, share_password
      FROM folders
      WHERE share_url = ?
    `).get(params.id) as ShareItem | undefined : undefined

    const item = file || folder

    if (!item) {
      return NextResponse.json(
        { error: "共有リンクが見つからないか、期限切れです" },
        { status: 404 }
      )
    }

    if (!item.share_password) {
      return NextResponse.json(
        { error: "パスワードは不要です" },
        { status: 400 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, item.share_password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "パスワードが正しくありません" },
        { status: 401 }
      )
    }

    // Set cookie to remember authentication for this share
    const cookieStore = cookies()
    cookieStore.set(`share_auth_${params.id}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 // 1 hour
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Share auth error:", error)
    return NextResponse.json(
      { error: "認証に失敗しました" },
      { status: 500 }
    )
  }
}