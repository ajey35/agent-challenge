"use client"

import { useState, useEffect } from "react"
import { type Email } from "@/mastra/agents/inbox-agent"
import { Search, Archive, Trash2, Star, MoreVertical } from "lucide-react"
import { Button } from "./ui/button"
import { useChat } from "@/contexts/chat-context"

interface InboxContainerProps {
  onEmailSelect: (email: Email) => void
  category?: string
}

export default function InboxContainer({ onEmailSelect, category }: InboxContainerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set())
  // selection handled by parent via onEmailSelect
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const chat = useChat()
  const emails = chat.emails ?? []
  const setEmails = chat.setEmails ?? (() => {})
  // Search and filter
  const filteredEmails = emails.filter(
    (email: Email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // If a category is requested (from sidebar), filter accordingly
  let displayedEmails = filteredEmails
  if (category) {
    if (category === "Un-Read" || category.toLowerCase().includes("unread")) {
      displayedEmails = filteredEmails.filter((e: any) => !!e.unread)
    } else if (category === "Important-Mails" || category.toLowerCase().includes("important")) {
      displayedEmails = filteredEmails.filter((e: any) => !!e.starred)
    }
  }
  // if toolResults arrive, update drafts in context
  useEffect(() => {
    const toolResults = chat.lastToolResults
    console.log("toolResults",toolResults);
    if (toolResults?.UnReadEmails) {
      setEmails(toolResults.UnReadEmails)
    }
    else if(toolResults?.ImportantEmails){
      setEmails(toolResults.ImportantEmails)
    }
  }, [chat.lastToolResults,emails])

  // Selection logic
  const toggleSelectAll = () => {
    if (selectedEmails.size === displayedEmails.length && displayedEmails.length > 0) {
      setSelectedEmails(new Set())
    } else {
      setSelectedEmails(new Set(displayedEmails.map((e) => e.id)))
    }
  }

  const toggleEmail = (id: string) => {
    const newSelected = new Set(selectedEmails)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedEmails(newSelected)
  }

  const toggleStar = (id: string) => {
    const newStarred = new Set(starredEmails)
    if (newStarred.has(id)) newStarred.delete(id)
    else newStarred.add(id)
    setStarredEmails(newStarred)
  }

  const handleDeleteEmail = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation?.()
    setEmails(emails.filter((email: Email) => email.id !== id))
    setSelectedEmails((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setStarredEmails((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    if (selectedEmails.size === 0) return
    setEmails(emails.filter((email: Email) => !selectedEmails.has(email.id)))
    setSelectedEmails(new Set())
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Bar */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-sm px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-3 border border-border hover:border-primary/50 transition-all focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in emails..."
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
            checked={selectedEmails.size === displayedEmails.length && displayedEmails.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded cursor-pointer"
          />
        </Button>
        <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-all gap-2">
          <Archive className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Archive</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-destructive/10 transition-all gap-2" 
          onClick={handleBulkDelete}
          disabled={selectedEmails.size === 0}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Delete {selectedEmails.size > 0 ? `(${selectedEmails.size})` : ''}</span>
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground font-medium">
          {displayedEmails.length} {displayedEmails.length === 1 ? 'email' : 'emails'}
        </span>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {chat.isLoading ? (
          // Loading state
          <div className="space-y-4 p-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
  ) : displayedEmails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <div className="text-4xl">📭</div>
            </div>
            <p className="text-muted-foreground font-medium text-lg">No emails found</p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery ? "Try a different search" : "Your inbox is empty"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
              {displayedEmails.map((email: Email, index: number) => (
              <div
                key={email.id}
                onMouseEnter={() => setHoveredId(email.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  onEmailSelect?.(email)
                }}
                className={`px-6 py-4 hover:bg-muted/50 transition-all duration-200 group border-l-4 
                  ${selectedEmails.has(email.id) 
                    ? 'border-l-primary bg-primary/5' 
                    : 'border-l-transparent'} 
                  hover:border-l-primary animate-fade-in-up cursor-pointer`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(email.id)}
                    onChange={() => toggleEmail(email.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(email.id)
                    }}
                    className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                  >
                    <Star
                      size={18}
                      className={starredEmails.has(email.id) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"}
                    />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {email.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {email.from}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {email.subject}
                      </span>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {email.snippet}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 transition-opacity duration-200 ${
                    hoveredId === email.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEmail(email.id)
                      }}
                      className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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

      {/* Email viewing is handled by parent via onEmailSelect */}
    </div>
  )
}