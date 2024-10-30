import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await verifyAuth()
    
    if (!auth || auth.role !== "ADMIN") {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const database = db()

    // 本日の統計
    const today = database.prepare(`
      WITH downloads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE f.download_count > 0
        AND DATE(f.created_at) = DATE('now', 'localtime')
      ),
      uploads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE DATE(f.created_at) = DATE('now', 'localtime')
      )
      SELECT 
        COALESCE(uploads.total_size, 0) as upload_size,
        COALESCE(downloads.total_size * MAX(f.download_count), 0) as download_size
      FROM files f
      CROSS JOIN uploads
      CROSS JOIN downloads
      LIMIT 1
    `).get() as { upload_size: number, download_size: number }

    // 今週の統計
    const week = database.prepare(`
      WITH downloads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE f.download_count > 0
        AND DATE(f.created_at) >= DATE('now', '-7 days', 'localtime')
      ),
      uploads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE DATE(f.created_at) >= DATE('now', '-7 days', 'localtime')
      )
      SELECT 
        COALESCE(uploads.total_size, 0) as upload_size,
        COALESCE(downloads.total_size * MAX(f.download_count), 0) as download_size
      FROM files f
      CROSS JOIN uploads
      CROSS JOIN downloads
      LIMIT 1
    `).get() as { upload_size: number, download_size: number }

    // 今月の統計
    const month = database.prepare(`
      WITH downloads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE f.download_count > 0
        AND DATE(f.created_at) >= DATE('now', 'start of month', 'localtime')
      ),
      uploads AS (
        SELECT SUM(f.size) as total_size
        FROM files f
        WHERE DATE(f.created_at) >= DATE('now', 'start of month', 'localtime')
      )
      SELECT 
        COALESCE(uploads.total_size, 0) as upload_size,
        COALESCE(downloads.total_size * MAX(f.download_count), 0) as download_size
      FROM files f
      CROSS JOIN uploads
      CROSS JOIN downloads
      LIMIT 1
    `).get() as { upload_size: number, download_size: number }

    return NextResponse.json({
      today: {
        upload: today.upload_size || 0,
        download: today.download_size || 0
      },
      week: {
        upload: week.upload_size || 0,
        download: week.download_size || 0
      },
      month: {
        upload: month.upload_size || 0,
        download: month.download_size || 0
      }
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}