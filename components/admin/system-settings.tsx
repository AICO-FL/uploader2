"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Save } from "lucide-react"

interface Settings {
  site_name: string
  logo_url: string | null
}

export function SystemSettings() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "",
    logo_url: null,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      toast({
        title: "エラー",
        description: "設定の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: settings.site_name,
          logo_url: settings.logo_url || null
        }),
      })

      if (!res.ok) throw new Error("Failed to update settings")

      // 設定を再取得して最新の状態を反映
      await fetchSettings()

      // ページをリロードして変更を反映
      window.location.reload()

      toast({
        title: "保存完了",
        description: "システム設定を更新しました",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">システム設定</h2>
      <Card>
        <CardHeader>
          <CardTitle>基本設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">サイト名</Label>
            <Input
              id="siteName"
              value={settings.site_name}
              onChange={(e) =>
                setSettings({ ...settings, site_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">ロゴURL</Label>
            <Input
              id="logoUrl"
              value={settings.logo_url || ""}
              onChange={(e) =>
                setSettings({ ...settings, logo_url: e.target.value || null })
              }
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}