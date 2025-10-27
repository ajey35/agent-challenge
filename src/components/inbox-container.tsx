"use client"

import { useCoAgent } from "@copilotkit/react-core"
import { useState } from "react"
import { type Email, type InboxState, initialInboxState } from "@/mastra/agents/inbox-agent"
import { Search } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface InboxContainerProps {
  onEmailSelect: (email: Email) => void
}

export default function InboxContainer({ onEmailSelect }: InboxContainerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { state, setState } = useCoAgent<InboxState>({
    name: "personalagent",
    initialState: initialInboxState,
  })

  const handleDeleteEmail = (id: string) => {
    setState({
      ...state,
      inboxEmails: (state?.inboxEmails || []).filter((e) => e.id !== id),
    })
  }

  const filteredEmails = (state?.inboxEmails || []).filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredEmails.map((email) => (
          <div
            key={email.id}
            className="flex flex-col gap-1 p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onEmailSelect(email)}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{email.from}</span>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteEmail(email.id)
                }}
              >
                Delete
              </Button>
            </div>
            <div className="font-medium">{email.subject}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">{email.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  )
}