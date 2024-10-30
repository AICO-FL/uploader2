"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Settings {
  site_name: string
}

export function SiteFooter() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "File Uploader"
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
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {settings.site_name} トップページ
        </Link>
      </div>
    </footer>
  )
}