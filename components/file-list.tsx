"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import { Download, FolderInput, Trash2, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { ShareDialog } from "./share-dialog"
import { formatBytes } from "@/lib/utils"
import type { File } from "@/types/database"

interface Folder {
  id: string
  name: string
}

interface FileListProps {
  files: File[]
  onFileDeleted?: () => void
  currentFolderId?: string
  isGuest?: boolean
  allowDelete?: boolean
}

export function FileList({ 
  files, 
  onFileDeleted, 
  currentFolderId, 
  isGuest = false,
  allowDelete = false
}: FileListProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<File | null>(null)
  const [targetFolderId, setTargetFolderId] = useState<string>("root")
  const [selectedFileId, setSelectedFileId] = useState("")
  const { toast } = useToast()

  // フォルダー一覧を初期読み込みおよび移動後に再取得
  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders")
      if (!res.ok) throw new Error("Failed to fetch folders")
      const data = await res.json()
      setFolders(data.filter((f: Folder) => f.id !== currentFolderId))
    } catch (error) {
      toast({
        title: "エラー",
        description: "フォルダー一覧の取得に失敗しました",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    if (!isGuest) {
      fetchFolders()
    }
  }, [isGuest])

  const handleMove = async () => {
    try {
      const res = await fetch("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: selectedFiles,
          folderId: targetFolderId === "root" ? null : targetFolderId
        })
      })

      if (!res.ok) throw new Error("Failed to move files")

      setSelectedFiles([])
      setShowMoveDialog(false)
      await fetchFolders() // フォルダー一覧を再取得
      if (onFileDeleted) onFileDeleted()
      
      toast({
        title: "移動完了",
        description: "ファイルを移動しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルの移動に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleMoveClick = () => {
    fetchFolders()
    setShowMoveDialog(true)
  }

  const handleShare = (fileId: string) => {
    setSelectedFileId(fileId)
    setShowShareDialog(true)
  }

  const handleDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`)
      if (!response.ok) throw new Error("ダウンロードに失敗しました")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = files.find(f => f.id === fileId)?.name || "download"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルのダウンロードに失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleDeleteClick = (file: File) => {
    setFileToDelete(file)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return

    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to delete file")

      setShowDeleteDialog(false)
      setFileToDelete(null)
      if (onFileDeleted) onFileDeleted()
      toast({
        title: "削除完了",
        description: "ファイルを削除しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルの削除に失敗しました",
        variant: "destructive"
      })
    }
  }

  const handleBulkDownload = async () => {
    try {
      const response = await fetch("/api/files/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: selectedFiles.length > 0 ? selectedFiles : files.map(f => f.id)
        })
      })

      if (!response.ok) throw new Error("ダウンロードに失敗しました")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "files.zip"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルのダウンロードに失敗しました",
        variant: "destructive"
      })
    }
  }

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "なし"
    const folder = folders.find(f => f.id === folderId)
    return folder ? folder.name : "なし"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedFiles.length > 0 && !isGuest && (
            <Button onClick={handleMoveClick}>
              <FolderInput className="h-4 w-4 mr-2" />
              フォルダーに移動
            </Button>
          )}
          {files.length > 0 && (
            <Button variant="outline" onClick={handleBulkDownload}>
              <Download className="h-4 w-4 mr-2" />
              すべてダウンロード
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedFiles.length === files.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFiles(files.map(f => f.id))
                    } else {
                      setSelectedFiles([])
                    }
                  }}
                />
              </TableHead>
              <TableHead>ファイル名</TableHead>
              {!isGuest && <TableHead>フォルダー</TableHead>}
              <TableHead>サイズ</TableHead>
              <TableHead>アップロード日時</TableHead>
              <TableHead>ダウンロード数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFiles([...selectedFiles, file.id])
                      } else {
                        setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{file.name}</TableCell>
                {!isGuest && (
                  <TableCell>{getFolderName(file.folder_id)}</TableCell>
                )}
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  {new Date(file.created_at).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </TableCell>
                <TableCell>{file.download_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(file.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare(file.id)}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    {allowDelete && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ファイルの移動</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={targetFolderId} onValueChange={setTargetFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="移動先フォルダーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">ルートフォルダー</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleMove} className="w-full">
              移動
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        type="file"
        id={selectedFileId}
        isGuest={isGuest}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ファイルの削除</DialogTitle>
            <DialogDescription>
              {fileToDelete?.name} を削除してもよろしいですか？
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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