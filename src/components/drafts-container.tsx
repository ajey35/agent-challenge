"use client"

import React from "react"
import { Send, Edit2, Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useCoAgent, useCopilotAction } from "@copilotkit/react-core"
import { type Email } from "@/mastra/agents/inbox-agent"
import { type DraftsState, initialDraftsState } from "@/mastra/agents/drafts-agent"

interface DraftsContainerProps {
  onDraftSelect: (draft: Email) => void
  themeColor:string
}

export default function DraftsContainer({ onDraftSelect, themeColor }: DraftsContainerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showNewDraftModal, setShowNewDraftModal] = useState(false)
  const [editingDraft, setEditingDraft] = useState<Email | null>(null)
  const [newDraft, setNewDraft] = useState({
    subject: "",
    to: "",
    snippet: "",
  })

  const { state, setState } = useCoAgent<DraftsState>({
    name: "personalagent",
    initialState: initialDraftsState,
  })
  useCopilotAction({
    name: "getDrafts",
    description: "Get and display draft emails",
    available: "frontend",
    render: ({ args }) => {
      return (
        <div style={{ backgroundColor: themeColor }} className="rounded-2xl max-w-md w-full text-white p-4">
          <p className="font-semibold">✓ Drafts Updated</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-white text-sm">View details</summary>
            <pre
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              className="overflow-x-auto text-xs bg-white/20 p-3 rounded-lg mt-2"
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </details>
        </div>
      )
    },
  })

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault()
    if (newDraft.subject.trim() && newDraft.to.trim()) {
      const draft: Email = {
        id: `draft-${Date.now()}`,
        subject: newDraft.subject,
        from: "you@gmail.com",
        to: newDraft.to,
        snippet: newDraft.snippet.substring(0, 100) || "No content",
      }
      if (editingDraft) {
        // Update existing draft
        setState({
          ...state,
          draftMails: (state?.draftMails || []).map((d) => 
            d.id === editingDraft.id ? { ...draft, id: d.id } : d
          ),
        })
      } else {
        // Create new draft
        setState({
          ...state,
          draftMails: [...(state?.draftMails || []), draft],
        })
      }
      
      setNewDraft({ subject: "", to: "", snippet: "" })
      setShowNewDraftModal(false)
      setEditingDraft(null)
    }
  }

  const handleEditClick = (draft: Email) => {
    setEditingDraft(draft)
    setNewDraft({
      subject: draft.subject,
      to: draft.to,
      snippet: draft.snippet || "",
    })
    setShowNewDraftModal(true)
  }

  const handleDeleteDraft = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setState({
      ...state,
      draftMails: (state?.draftMails || []).filter((d) => d.id !== id),
    })
  }

  const handleSendDraft = (draft: Email, e?: React.MouseEvent) => {
    e?.stopPropagation()
    console.log("[v0] Draft sent:", draft)
    handleDeleteDraft(draft.id)
  }

  const drafts = state?.draftMails || []

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-sm px-6 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Button
          onClick={() => {
            setEditingDraft(null)
            setNewDraft({ subject: "", to: "", snippet: "" })
            setShowNewDraftModal(true)
          }}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 text-primary-foreground rounded-full gap-2 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Draft</span>
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground font-medium">{drafts.length} drafts</span>
      </div>

      {/* Drafts List */}
      <div className="flex-1 overflow-auto">
        {drafts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-4 text-4xl">✎</div>
            <p className="text-muted-foreground font-medium text-lg">No drafts yet</p>
            <p className="text-sm text-muted-foreground/70">Create a new draft to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {drafts.map((draft: Email, index: number) => (
              <div
                key={draft.id}
                onMouseEnter={() => setHoveredId(draft.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onDraftSelect(draft)}
                className="px-6 py-4 hover:bg-muted/50 transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-accent animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-accent/30 group-hover:to-accent/20 transition-all text-lg">
                    ✎
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {draft.subject || "(No Subject)"}
                      </p>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full whitespace-nowrap font-medium">
                        Draft
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">To: {draft.to}</p>
                    <p className="text-sm text-muted-foreground truncate">{draft.snippet}</p>
                  </div>
                  <div
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      hoveredId === draft.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10 transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClick(draft)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-accent/10 transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSendDraft(draft)
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDraft(draft.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New/Edit Draft Modal */}
      {showNewDraftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">{editingDraft ? "Edit Draft" : "Create New Draft"}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNewDraftModal(false)
                  setEditingDraft(null)
                }}
                className="hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">To</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={newDraft.to}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDraft({ ...newDraft, to: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                <input
                  type="text"
                  placeholder="Email subject"
                  value={newDraft.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDraft({ ...newDraft, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                <textarea
                  placeholder="Write your message..."
                  value={newDraft.snippet}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDraft({ ...newDraft, snippet: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewDraftModal(false)
                  setEditingDraft(null)
                }}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
                <Button
                type="submit"
                onClick={(e) => handleCreateDraft(e)}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transition-all"
              >
                {editingDraft ? "Update Draft" : "Create Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}