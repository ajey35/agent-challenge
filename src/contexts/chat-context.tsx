"use client"

import React, { createContext, useContext } from "react"
import type { ChatMessage } from "@/types/chat"
import type { Email } from "@/mastra/agents/inbox-agent"

export type SendMessageFn = (text: string, options?: { agentName?: string }) => Promise<any>

export interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  lastToolResults?: Record<string, any> | null
  // Email states exposed for components
  drafts?: Email[]
  emails?: Email[]
  importantMails?: Email[]
  sentMails?: Email[]
  setImportantMails?: (d: Email[]) => void
  setDrafts?: (d: Email[]) => void
  setEmails?: (d: Email[]) => void
  setSentMails?: (d: Email[]) => void
  sendMessage: SendMessageFn
}


export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatInterface provider")
  return ctx
}
