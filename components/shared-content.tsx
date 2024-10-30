"use client"

import { Download, File, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatBytes } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

interface Settings {
  site_name: string
}

interface SharedContentProps {
  content: any
  type: "file" | "files" | "folder"
}

export function SharedContent({ content, type }: SharedContentProps) {
  const { toast } = useToast()
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

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`)
      if (!response.ok) throw new Error("ダウンロードに失敗しました")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
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

  const files = type === "files" ? content : content.files

  if (type === "file") {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{content.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(content.size)}
                </p>
              </div>
            </div>
            <Button onClick={() => handleDownload(content.id, content.name)}>
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Folder className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold">
            {type === "folder" ? content.name : "共有ファイル一覧"}
          </h2>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ファイル名</TableHead>
                <TableHead>サイズ</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file: any) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.name)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ダウンロード
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}