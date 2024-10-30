"use client"

import { useState } from "react"
import { Upload, File as FileIcon } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingOverlay } from "@/components/loading-overlay"

interface FileUploadProps {
  maxFiles?: number
  maxSize?: number
  onUploadComplete?: () => void
  isGuest?: boolean
}

export function FileUpload({
  maxFiles = 5,
  maxSize = 100 * 1024 * 1024,
  onUploadComplete,
  isGuest = false
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ [key: string]: number }>({})
  const [totalProgress, setTotalProgress] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const existingFileIds = searchParams.get("files")?.split(",") || []

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    if (selectedFiles.length > maxFiles) {
      toast({
        title: "ファイル数制限",
        description: `最大${maxFiles}個までアップロードできます`,
        variant: "destructive",
      })
      return
    }

    const invalidFiles = selectedFiles.filter(file => file.size > maxSize)
    if (invalidFiles.length > 0) {
      toast({
        title: "ファイルサイズ制限",
        description: `最大サイズは${formatBytes(maxSize)}までです`,
        variant: "destructive",
      })
      return
    }

    setFiles(selectedFiles)
  }

  const uploadFiles = async () => {
    if (!files.length) return

    setUploading(true)
    setProgress({})
    setTotalProgress(0)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append("files", file)
      })

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "アップロードに失敗しました")
      }

      const data = await response.json()
      
      toast({
        title: "アップロード完了",
        description: "ファイルのアップロードが完了しました"
      })

      setFiles([])
      setProgress({})
      setTotalProgress(100)

      // アップロード完了後の処理
      if (onUploadComplete) {
        onUploadComplete()
      } else if (isGuest) {
        // ゲストユーザーの場合は、既存のファイルIDと新しいファイルIDを結合
        const newFileIds = data.files.map((f: any) => f.id)
        const allFileIds = [...existingFileIds, ...newFileIds]
        router.push(`/guest-dashboard?files=${allFileIds.join(",")}`)
      } else {
        // ログインユーザーの場合は通常のダッシュボードに遷移
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "アップロードに失敗しました",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center relative",
          "hover:border-primary cursor-pointer transition-colors",
          files.length > 0 && "border-primary bg-primary/5"
        )}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        
        <h3 className="text-lg font-semibold mb-2">
          {uploading ? "アップロード中..." : "ここにファイルをドロップまたはクリックして選択"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          最大{maxFiles}個のファイル、{formatBytes(maxSize)}まで
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          {files.map((file) => (
            <div key={file.name} className="bg-background rounded-lg p-4">
              <div className="flex items-center gap-4">
                <FileIcon className="w-8 h-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              {uploading && progress[file.name] !== undefined && (
                <Progress value={progress[file.name]} className="mt-2" />
              )}
            </div>
          ))}

          <Button
            className="w-full"
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? "アップロード中..." : "アップロード開始"}
          </Button>
        </div>
      )}

      {uploading && (
        <>
          <Alert className="mt-4">
            <AlertTitle>アップロード中</AlertTitle>
            <AlertDescription>
              アップロードが完了するまでこのページを閉じないでください。
              <div className="mt-2">
                <Progress value={totalProgress} className="w-full" />
                <p className="text-sm text-center mt-1">{totalProgress}%</p>
              </div>
            </AlertDescription>
          </Alert>
          <LoadingOverlay />
        </>
      )}
    </div>
  )
}