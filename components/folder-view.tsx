"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileList } from "@/components/file-list"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Edit2, Folder, Save } from "lucide-react"

interface FolderViewProps {
  folderId: string
}

export function FolderView({ folderId }: FolderViewProps) {
  const [folder, setFolder] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchFolder()
  }, [folderId])

  const fetchFolder = async () => {
    try {
      const res = await fetch(`/api/folders/${folderId}`)
      if (!res.ok) throw new Error("Failed to fetch folder")
      const data = await res.json()
      setFolder(data)
      setNewName(data.name)
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダーの取得に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleRename = async () => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      })

      if (!res.ok) throw new Error("Failed to rename folder")

      setIsEditing(false)
      fetchFolder()
      toast({
        title: "更新完了",
        description: "フォルダー名を更新しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダー名の更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  if (!folder) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Folder className="h-6 w-6" />
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-48"
                />
                <Button size="icon" onClick={handleRename}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{folder.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <FileList
        files={folder.files}
        onFileDeleted={fetchFolder}
        currentFolderId={folderId}
      />
    </div>
  )
}