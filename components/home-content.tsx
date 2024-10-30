"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/file-upload"

interface Settings {
  site_name: string
  logo_url: string | null
}

export function HomeContent() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "File Uploader",
    logo_url: null
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      }
    }
    fetchSettings()
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{settings.site_name}</h1>
        <p className="text-lg text-muted-foreground">
          ファイルをドラッグ＆ドロップまたはクリックしてアップロード
        </p>
      </div>

      <FileUpload
        maxFiles={5}
        maxSize={100 * 1024 * 1024}
        isGuest={true}
      />
    </div>
  )
}