"use client"

import { useState } from "react"
import { X, Send, Paperclip, Smile } from "lucide-react"
import { useChat } from "@/contexts/chat-context"
import type { Email } from "@/mastra/agents/inbox-agent"

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showCcBcc, setShowCcBcc] = useState(false)

  const chat = useChat()
  const setDrafts = chat.setDrafts ?? (() => {})
  const existingDrafts = chat.drafts ?? []

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      alert("Please fill in recipient and subject")
      return
    }

    setIsSending(true)
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsSending(false)

    // Reset form
    setTo("")
    setCc("")
    setSubject("")
    setBody("")
    onClose()
  }

  const handleSaveDraft = () => {
    const draft: Email = {
      id: Date.now().toString(),
      from: "you@example.com",
      to: to || "",
      subject: subject || "(No subject)",
      snippet: body.slice(0, 140),
    }

    try {
      // append to existing drafts from context if available
      setDrafts([...existingDrafts, draft])
    } catch (e) {
      // ignore
    }
    // clear and close
    setTo("")
    setCc("")
    setSubject("")
    setBody("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {showCcBcc ? "Hide" : "Add"} Cc, Bcc
            </button>

            {showCcBcc && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Cc</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                rows={8}
                className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Paperclip size={18} />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Smile size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // simply close
                onClose()
              }}
              className="px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors font-medium text-sm"
            >
              Discard
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50 text-sm font-medium"
            >
              Save Draft
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white font-medium text-sm transition-colors active:scale-95"
            >
              <Send size={16} />
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComposeModal
