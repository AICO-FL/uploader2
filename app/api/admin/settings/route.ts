import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
    const settings = database.prepare(`
      SELECT site_name, logo_url
      FROM settings
      WHERE id = 1
    `).get() as { site_name: string; logo_url: string | null } | undefined

    return NextResponse.json(settings || {
      site_name: "File Uploader",
      logo_url: null
    })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const settings = await request.json()
    const database = db()
    
    // トランザクションを開始
    database.prepare('BEGIN TRANSACTION').run()

    try {
      // 既存の設定を削除
      database.prepare(`
        DELETE FROM settings WHERE id = 1
      `).run()

      // 新しい設定を挿入
      const updated = database.prepare(`
        INSERT INTO settings (id, site_name, logo_url)
        VALUES (1, ?, ?)
        RETURNING site_name, logo_url
      `).get(settings.site_name, settings.logo_url) as { site_name: string; logo_url: string | null }

      // トランザクションをコミット
      database.prepare('COMMIT').run()

      return NextResponse.json(updated)
    } catch (error) {
      // エラーが発生した場合はロールバック
      database.prepare('ROLLBACK').run()
      throw error
    }
  } catch (error) {
    console.error("Update settings error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}