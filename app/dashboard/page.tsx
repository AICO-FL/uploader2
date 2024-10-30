"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileList } from "@/components/file-list"
import { FolderList } from "@/components/folder-list"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserManagement } from "@/components/admin/user-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { FileManagement } from "@/components/admin/file-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import type { File } from "@/types/database"

interface FileWithFolder extends File {
  folder_name?: string
}

export default function DashboardPage() {
  const [files, setFiles] = useState<FileWithFolder[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) throw new Error("認証に失敗しました")
        const data = await res.json()
        setIsAdmin(data.role === "ADMIN")
        setIsLoading(false)
      } catch (error) {
        router.push("/login")
      }
    }
    checkAuth()
  }, [router])

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files")
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data.files)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイル一覧の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      fetchFiles()
    }
  }, [isLoading, isAdmin])

  if (isLoading) {
    return null
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader isAdmin />
        <main className="flex-1 container mx-auto py-8">
          <Tabs defaultValue="files" className="space-y-4">
            <TabsList>
              <TabsTrigger value="files">ファイル管理</TabsTrigger>
              <TabsTrigger value="users">ユーザー管理</TabsTrigger>
              <TabsTrigger value="settings">システム設定</TabsTrigger>
            </TabsList>
            <TabsContent value="files">
              <FileManagement />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
            <TabsContent value="settings">
              <SystemSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader onFileUploaded={fetchFiles} />
      <main className="flex-1 container mx-auto py-8">
        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">ファイル</TabsTrigger>
            <TabsTrigger value="folders">フォルダー</TabsTrigger>
          </TabsList>
          <TabsContent value="files">
            <FileList 
              files={files} 
              onFileDeleted={fetchFiles} 
              allowDelete={true}
            />
          </TabsContent>
          <TabsContent value="folders">
            <FolderList onFolderCreated={fetchFiles} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}