import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const database = db()
    database.prepare("SELECT 1").get()
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      { 
        status: "unhealthy",
        error: "Database connection failed"
      },
      { status: 503 }
    )
  }
}