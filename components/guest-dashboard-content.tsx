"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FileList } from "@/components/file-list"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Link, Upload } from "lucide-react"
import { ShareDialog } from "@/components/share-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
import type { File } from "@/types/database"

export function GuestDashboardContent() {
  const [files, setFiles] = useState<File[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileIds = searchParams.get("files")?.split(",") || []

  const fetchFiles = useCallback(async () => {
    if (fileIds.length === 0) {
      router.push("/")
      return
    }

    try {
      const res = await fetch(`/api/files/guest?ids=${fileIds.join(",")}`)
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data.files)

      // ファイルが1つもない場合はトップページにリダイレクト
      if (data.files.length === 0) {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイル一覧の取得に失敗しました",
        variant: "destructive"
      })
    }
  }, [fileIds, toast, router])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleUploadComplete = () => {
    setShowUploadDialog(false)
    fetchFiles()
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 flex-1 mr-4">
          <p className="text-blue-700">
            「共有リンクを作成」を押して専用の共有URLを発行することで、ファイルが7日間ダウンロード可能です。URLを友人に共有しましょう。
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            追加アップロード
          </Button>
          <Button onClick={() => setShowShareDialog(true)}>
            <Link className="h-4 w-4 mr-2" />
            共有リンクを作成
          </Button>
        </div>
      </div>

      <FileList 
        files={files} 
        isGuest 
        onFileDeleted={fetchFiles} 
        allowDelete={true}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        type="file"
        id="guest"
        isGlobal
        isGuest
        fileIds={fileIds}
      />

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>ファイルのアップロード</DialogTitle>
          </DialogHeader>
          <FileUpload
            maxFiles={5}
            maxSize={100 * 1024 * 1024}
            onUploadComplete={handleUploadComplete}
            isGuest={true}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}