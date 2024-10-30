"use client"

import { Button } from "@/components/ui/button"
import { LogIn, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

interface SiteHeaderProps {
  settings?: {
    site_name: string
    logo_url: string | null
  }
}

interface UserInfo {
  email: string | null
}

export function SiteHeader({ settings }: SiteHeaderProps) {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            {settings?.logo_url && (
              <Image
                src={settings.logo_url}
                alt={settings?.site_name || "Logo"}
                width={32}
                height={32}
                className="object-contain"
              />
            )}
            <span className="font-bold text-xl">{settings?.site_name || "File Uploader"}</span>
          </div>
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-md bg-muted">
                <User className="h-4 w-4" />
                <span className="text-sm">ログイン中: {user.email}</span>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <LogIn className="h-4 w-4 mr-1" />
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}