import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const database = db()
    const settings = database.prepare(`
      SELECT site_name, logo_url
      FROM settings
      WHERE id = 1
    `).get() as { site_name: string; logo_url: string | null } || {
      site_name: "File Uploader",
      logo_url: null
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json(
      { error: "設定の取得に失敗しました" },
      { status: 500 }
    )
  }
}