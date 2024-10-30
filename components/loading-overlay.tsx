"use client"

import { Loader2 } from "lucide-react"

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-lg font-medium">ファイルをアップロード中...</p>
        <p className="text-sm text-muted-foreground">
          完了後、自動的にダッシュボードに移動します
        </p>
      </div>
    </div>
  )
}