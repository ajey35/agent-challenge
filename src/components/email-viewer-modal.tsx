"use client"

import { X, Reply, ReplyAll, Forward, Archive, Trash2, MoreVertical, ArrowLeft, Sparkles } from "lucide-react"
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

  const senderInitial = email.from.charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up max-w-4xl">
        {/* Header */}
        <div className="border-b border-border bg-background sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-primary/10 transition-all"
              >
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm">Summarize with AI</span>
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-muted rounded-full">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Subject */}
            <h2 className="text-2xl font-bold text-foreground mb-6">{email.subject}</h2>

            {/* Sender Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {senderInitial}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{email.from}</p>
                <p className="text-sm text-muted-foreground">To: {email.to}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">2 hours ago</p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Email Body */}
            <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
              {email.body || email.snippet}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border bg-background/50 backdrop-blur-sm p-4 flex items-center gap-2 sticky bottom-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all"
            onClick={() => onReply?.(email)}
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all"
          >
            <ReplyAll className="w-4 h-4" />
            <span>Reply All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/10 transition-all"
          >
            <Forward className="w-4 h-4" />
            <span>Forward</span>
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-primary/10 transition-all"
          >
            <Archive className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-destructive/10 hover:text-destructive transition-all"
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
