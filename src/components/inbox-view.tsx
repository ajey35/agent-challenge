"use client"

import { Archive, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { useState } from "react"
import EmailViewerModal from "./email-viewer-modal"

const EmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  snippet: z.string(),
  body: z.string().optional(),
})

type Email = z.infer<typeof EmailSchema>

interface InboxViewProps {
  emails: Email[]
  onDeleteEmail?: (id: string) => void
}

export default function InboxView({ emails, onDeleteEmail }: InboxViewProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set())
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  const filteredEmails = (emails ?? []).filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(filteredEmails.map((e) => e.id)))
    }
  }

  const toggleEmail = (id: string) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEmails(newSelected)
  }

  const toggleStar = (id: string) => {
    const newStarred = new Set(starredEmails)
    if (newStarred.has(id)) {
      newStarred.delete(id)
    } else {
      newStarred.add(id)
    }
    setStarredEmails(newStarred)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Bar */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-sm px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-3 border border-border hover:border-primary/50 transition-all focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm px-6 py-3 flex items-center gap-3 sticky top-16 z-10">
        <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="hover:bg-primary/10 transition-all">
          <input
            type="checkbox"
            checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded cursor-pointer"
          />
        </Button>
        <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-all gap-2">
          <Archive className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Archive</span>
        </Button>
        <Button variant="ghost" size="sm" className="hover:bg-destructive/10 transition-all gap-2">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Delete</span>
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground font-medium">{filteredEmails.length} emails</span>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {filteredEmails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-4xl">∅</div>
            <p className="text-muted-foreground font-medium text-lg">No emails found</p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery ? "Try a different search" : "Your inbox is empty"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEmails.map((email, index) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className="px-6 py-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmail(email.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded mt-1 cursor-pointer"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(email.id)
                    }}
                    className="transition-all hover:scale-125 text-lg"
                  >
                    {starredEmails.has(email.id) ? "★" : "☆"}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {email.from}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">2h ago</span>
                    </div>
                    <p className="font-medium text-foreground truncate">{email.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{email.snippet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmailViewerModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
        onDelete={(id) => {
          onDeleteEmail?.(id)
          setSelectedEmail(null)
        }}
      />
    </div>
  )
}
