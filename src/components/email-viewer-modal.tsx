"use client"

import { X, Reply, ReplyAll, Forward, Archive, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { z } from "zod"

const EmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  snippet: z.string(),
  body: z.string().optional(),
})

type Email = z.infer<typeof EmailSchema>

interface EmailViewerModalProps {
  email: Email | null
  onClose: () => void
  onReply?: (email: Email) => void
  onDelete?: (id: string) => void
}

export default function EmailViewerModal({ email, onClose, onReply, onDelete }: EmailViewerModalProps) {
  if (!email) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground truncate">{email.subject}</h2>
            <p className="text-sm text-muted-foreground mt-1">From: {email.from}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{email.from}</p>
                    <p className="text-sm text-muted-foreground">To: {email.to}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{email.body || email.snippet}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-6 flex items-center gap-2 sticky bottom-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all rounded-lg bg-transparent"
            onClick={() => onReply?.(email)}
          >
            <Reply className="w-4 h-4" />
            <span className="hidden sm:inline">Reply</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all rounded-lg bg-transparent"
          >
            <ReplyAll className="w-4 h-4" />
            <span className="hidden sm:inline">Reply All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all rounded-lg bg-transparent"
          >
            <Forward className="w-4 h-4" />
            <span className="hidden sm:inline">Forward</span>
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all rounded-lg bg-transparent"
          >
            <Archive className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-all rounded-lg bg-transparent"
            onClick={() => {
              onDelete?.(email.id)
              onClose()
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-muted rounded-lg">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
