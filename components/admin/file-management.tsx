"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Download, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"

interface File {
  id: string
  name: string
  size: number
  created_at: string
  download_count: number
  user: {
    name: string
    email: string
  } | null
}

interface Stats {
  today: {
    upload: number
    download: number
  }
  week: {
    upload: number
    download: number
  }
  month: {
    upload: number
    download: number
  }
}

export function FileManagement() {
  const [files, setFiles] = useState<File[]>([])
  const [stats, setStats] = useState<Stats>({
    today: { upload: 0, download: 0 },
    week: { upload: 0, download: 0 },
    month: { upload: 0, download: 0 }
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
    fetchStats()
  }, [])

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/admin/files")
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイル一覧の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      const data = await res.json()
      setStats(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "統計情報の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFile = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/files/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete file")

      fetchFiles()
      fetchStats()
      toast({
        title: "削除完了",
        description: "ファイルを削除しました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "ファイルの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ファイル管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日の転送量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.today.upload + stats.today.download)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              アップロード: {formatBytes(stats.today.upload)} / ダウンロード: {formatBytes(stats.today.download)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の転送量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.week.upload + stats.week.download)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              アップロード: {formatBytes(stats.week.upload)} / ダウンロード: {formatBytes(stats.week.download)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の転送量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.month.upload + stats.month.download)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              アップロード: {formatBytes(stats.month.upload)} / ダウンロード: {formatBytes(stats.month.download)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ファイル名</TableHead>
              <TableHead>アップロードユーザー</TableHead>
              <TableHead>サイズ</TableHead>
              <TableHead>アップロード日時</TableHead>
              <TableHead>ダウンロード数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.name}</TableCell>
                <TableCell>
                  {file.user ? file.user.name : "ゲスト"}
                </TableCell>
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
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}