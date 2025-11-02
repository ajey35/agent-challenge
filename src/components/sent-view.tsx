"use client"

import { useState } from "react"
import { Search, Archive, Trash2, MoreVertical } from "lucide-react"
import { useChat } from "@/contexts/chat-context"
import type { Email } from "@/mastra/agents/inbox-agent"
// lightweight replacement for date-fns.formatDistanceToNow to avoid extra dependency at build time
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
  const now = Date.now()
  const diff = Math.round((now - date.getTime()) / 1000) // seconds
  const absDiff = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34524, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]

  let unit: Intl.RelativeTimeFormatUnit = 'second'
  let value = absDiff

  for (let i = 0, acc = absDiff; i < divisions.length; i++) {
    const [factor, u] = divisions[i]
    if (acc < factor) {
      unit = u
      value = Math.round(diff / (i === 0 ? 1 : divisions.slice(0, i).reduce((a, b) => a * b[0], 1)))
      break
    }
    acc = acc / factor
  }

  // If options.addSuffix is true, rtf will provide strings like "in 1 day" or "1 day ago" depending on sign
  if (options?.addSuffix ?? false) {
    return rtf.format(-value, unit)
  }

  return `${Math.abs(value)} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`
}

interface SentViewProps {
  onEmailSelect: (email: Email) => void;
}

export default function SentView({ onEmailSelect }: SentViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const chat = useChat()
  const sentEmails = chat.sentMails ?? []
  
  console.log("Sent emails in view:", sentEmails);

  // Search and filter
  const filteredEmails = sentEmails.filter(
    (email: Email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Bar */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-sm px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-3 border border-border hover:border-primary/50 transition-all focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in sent mails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {filteredEmails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <div className="text-4xl">📤</div>
            </div>
            <p className="text-muted-foreground font-medium text-lg">No sent emails</p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery ? "Try a different search" : "Your sent folder is empty"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEmails.map((email: Email, index: number) => (
              <div
                key={email.id}
                onMouseEnter={() => setHoveredId(email.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onEmailSelect(email)}
                className="px-6 py-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {email.to.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        To: {email.to}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {email.timestamp
                          ? formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {email.subject}
                      </span>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {email.snippet && email.snippet.replace(/&#39;/g, "'")}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity duration-200 ${
                    hoveredId === email.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <button className="p-2 hover:bg-muted rounded transition-colors">
                      <Archive size={16} className="text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded transition-colors">
                      <MoreVertical size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}