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
  // drafts exposed so other components can render them
  drafts?: Email[]
  emails?:Email[]
  setDrafts?: (d: Email[]) => void
  setEmails?:(d:Email[])=>void
  sendMessage: SendMessageFn
}


export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatInterface provider")
  return ctx
}
