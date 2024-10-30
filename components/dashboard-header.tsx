"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Upload, User } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"

interface DashboardHeaderProps {
  onFileUploaded?: () => void
  isAdmin?: boolean
}

interface UserInfo {
  email: string | null
  name: string | null
  role: string
}

interface Settings {
  site_name: string
}

export function DashboardHeader({ onFileUploaded, isAdmin = false }: DashboardHeaderProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [settings, setSettings] = useState<Settings>({
    site_name: "File Uploader"
  })
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setUser(data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error)
      }
    }
    fetchUser()
  }, [])

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const handleUploadComplete = () => {
    setShowUploadDialog(false)
    if (onFileUploaded) {
      onFileUploaded()
    }
  }

  const displayName = user ? (user.name || user.email || "ユーザー") : "ゲストユーザー"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-xl">{settings.site_name}</span>
            <span className="text-muted-foreground">
              {isAdmin ? "管理者ダッシュボード" : "ダッシュボード"}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {!isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                アップロード
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {displayName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>ファイルのアップロード</DialogTitle>
            </DialogHeader>
            <FileUpload
              maxFiles={10}
              maxSize={4 * 1024 * 1024 * 1024}
              onUploadComplete={handleUploadComplete}
            />
          </DialogContent>
        </Dialog>
      )}
    </header>
  )
}