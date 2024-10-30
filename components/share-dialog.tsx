import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Copy, Link } from "lucide-react"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "file" | "folder"
  id: string
  isGlobal?: boolean
  isGuest?: boolean
  fileIds?: string[]
}

export function ShareDialog({ 
  open, 
  onOpenChange, 
  type, 
  id, 
  isGlobal,
  isGuest = false,
  fileIds = []
}: ShareDialogProps) {
  const [password, setPassword] = useState("")
  const [expiresIn, setExpiresIn] = useState(isGuest ? "7" : "none")
  const [shareUrl, setShareUrl] = useState("")
  const { toast } = useToast()

  // ダイアログが開かれるたびにステートをリセット
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPassword("")
      setExpiresIn(isGuest ? "7" : "none")
      setShareUrl("")
    }
    onOpenChange(open)
  }

  const handleShare = async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type,
          password: password || null,
          expiresIn: isGuest ? 7 : parseInt(expiresIn) || null,
          isGlobal,
          fileIds
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "共有リンクの作成に失敗しました")
      }

      const data = await res.json()
      setShareUrl(data.shareUrl)
      
      toast({
        title: "共有リンク作成完了",
        description: "共有リンクを作成しました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "共有リンクの作成に失敗しました",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "コピー完了",
        description: "共有リンクをクリップボードにコピーしました"
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: "クリップボードへのコピーに失敗しました",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>共有リンクの作成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="パスワード (オプション)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {!isGuest && (
            <div className="space-y-2">
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue placeholder="有効期限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">無期限</SelectItem>
                  <SelectItem value="7">7日</SelectItem>
                  <SelectItem value="14">14日</SelectItem>
                  <SelectItem value="30">30日</SelectItem>
                  <SelectItem value="120">120日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isGuest && (
            <div className="text-sm text-muted-foreground">
              共有リンクの有効期限は7日間です
            </div>
          )}
          {shareUrl ? (
            <div className="flex items-center space-x-2">
              <Input value={shareUrl} readOnly />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleShare} className="w-full">
              <Link className="h-4 w-4 mr-2" />
              共有リンクを作成
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}