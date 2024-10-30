"use client"

import { useState, useEffect } from "react"
import { Folder, Plus, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ShareDialog } from "./share-dialog"
import Link from "next/link"

interface FolderWithCount {
  id: string
  name: string
  _count: {
    files: number
  }
}

interface FolderListProps {
  onFolderCreated?: () => void
}

export function FolderList({ onFolderCreated }: FolderListProps) {
  const [folders, setFolders] = useState<FolderWithCount[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<FolderWithCount | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders")
      if (!res.ok) throw new Error("Failed to fetch folders")
      const data = await res.json()
      setFolders(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダーの取得に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleCreateFolder = async () => {
    try {
      setError("")
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "フォルダーの作成に失敗しました")
        return
      }

      setNewFolderName("")
      setCreateDialogOpen(false)
      setError("")
      fetchFolders()
      if (onFolderCreated) onFolderCreated()
      
      toast({
        title: "作成完了",
        description: "フォルダーを作成しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダーの作成に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleShare = (folderId: string) => {
    setSelectedFolderId(folderId)
    setShareDialogOpen(true)
  }

  const handleDeleteClick = (folder: FolderWithCount) => {
    setFolderToDelete(folder)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!folderToDelete) return

    try {
      const res = await fetch(`/api/folders/${folderToDelete.id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete folder")

      setDeleteDialogOpen(false)
      fetchFolders()
      toast({
        title: "削除完了",
        description: "フォルダーを削除しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダーの削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">フォルダー</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規フォルダー
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規フォルダーの作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="フォルダー名"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button onClick={handleCreateFolder} className="w-full">
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <Card key={folder.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="h-5 w-5 mr-2" />
                {folder.name}
              </CardTitle>
              <CardDescription>{folder._count.files}個のファイル</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/folders/${folder.id}`}>
                    開く
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(folder.id)}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  共有
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(folder)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        type="folder"
        id={selectedFolderId}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フォルダーの削除</DialogTitle>
            <DialogDescription className="pt-4 space-y-2">
              <p>フォルダー「{folderToDelete?.name}」を削除しますか？</p>
              {folderToDelete && folderToDelete._count.files > 0 && (
                <p className="text-red-500">
                  警告: このフォルダーには{folderToDelete._count.files}個のファイルが含まれています。
                  フォルダーを削除すると、これらのファイルもすべて削除されます。
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}