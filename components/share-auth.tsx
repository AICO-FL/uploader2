"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Lock, Loader2 } from "lucide-react"

interface ShareAuthProps {
  id: string
  type: "file" | "files" | "folder"
}

export function ShareAuth({ id, type }: ShareAuthProps) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/share/${id}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "認証に失敗しました")
      }

      // 認証成功後、ページをリロード
      window.location.reload()
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "認証に失敗しました",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            パスワード保護されたコンテンツ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  認証中...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  アクセス
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}