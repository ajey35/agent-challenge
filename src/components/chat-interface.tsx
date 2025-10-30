"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, User, Bot, X, Minus } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type ChatMessage, type ChatState } from "@/types/chat"
import { ChatContext } from "@/contexts/chat-context"
import type { PropsWithChildren } from "react"
import { Email } from "@/mastra/agents/inbox-agent"

export default function ChatInterface({ children }: PropsWithChildren<object>) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  })
  const [lastToolResults, setLastToolResults] = useState<Record<string, any> | null>(null)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(true)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = mounted ? (theme === "dark" || resolvedTheme === "dark") : true

  // State Variables for rendering results
  const [drafts, setDrafts] = useState<Email[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatState.messages])

  // next-themes is client-side; ensure mounted before reading theme
  useEffect(() => {
    setMounted(true)
  }, [])

  const sendMessage = async (text: string, options?: { agentName?: string }) => {
    if (!text.trim() || chatState.isLoading) return null

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    }

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }))

    try {
      const response = await fetch("/api/mastra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: options?.agentName ?? "personalMailAgent",
          messages: [...chatState.messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to get response")

      // Defensive: check toolResults and payload
      const toolResult = Array.isArray(data.toolResults) && data.toolResults.length > 0 ? data.toolResults[0] : null;
      const payload = toolResult && toolResult.payload ? toolResult.payload : null;
      const result = payload && payload.result ? payload.result : null;

      setLastToolResults(result || null)
      // console.log("fin-resp",payload?.result?.draftMails);
      // console.log("data.toolResults", payload?.result);
      if (toolResult) {
        console.log("hi heeloo", toolResult);
        if (payload) {
          console.log("hi heeloo tool name", payload.toolName);
          if (payload.toolName === "getDraftsTool" && result && result.draftMails) {
            setDrafts(result.draftMails);
          }
          else if (payload.toolName === "getUnreadEmailTool" && result && result.UnReadEmails) {
            console.log("unread mails");
            setEmails(result.UnReadEmails);
          }
          else if (payload.toolName === "getImportantEmailsTool" && result && result.ImportantEmails) {
            console.log("importantmails", result.ImportantEmails);
            setEmails(result.ImportantEmails);
          }
          else if (payload.toolName === "createEmailDraft" && result && result.draftMails) {
            setDrafts((prevDrafts) => {
              const newDrafts = result.draftMails.filter(
                (draft: Email) => !prevDrafts.some((d) => d.id === draft.id)
              );

              // Only update if there's actually a new draft
              if (newDrafts.length > 0) {
                return [...prevDrafts, ...newDrafts];
              }
              // Otherwise keep existing drafts unchanged
              return prevDrafts;
            });

          }

        }
      }
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text || "I processed your request but have no text response.",
        timestamp: Date.now(),
      }

      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }))
      return data
    } catch (error) {
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "An error occurred",
      }))
      console.log("error", error);
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatState.isLoading) return
    setInput("")
    await sendMessage(input)
  }

  // style helpers based on theme
  const cardBg = isDark ? "backdrop-blur-lg bg-slate-900/70 border border-slate-700" : "backdrop-blur-lg bg-white/80 border border-slate-200"
  const assistantBubble = isDark ? "bg-white/10 text-gray-100" : "bg-gray-100 text-gray-900"
  const userBubble = "bg-blue-600 text-white"

  const ctxValue = {
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    error: (chatState as any).error,
    lastToolResults,
    drafts,
    setDrafts,
    emails,
    setEmails,
    sendMessage,
  }

  return (
    <ChatContext.Provider value={ctxValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
          <button
            aria-label="Open chat"
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 rounded-full bg-primary/90 text-white shadow-lg flex items-center justify-center"
          >
            <ChatIcon />
          </button>
        ) : (
          <Card className={`${cardBg} shadow-2xl rounded-2xl w-[420px] h-[620px] flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">📨</div>
                <div>
                  <div className="text-sm font-semibold">Personal Mail Agent</div>
                  <div className="text-[11px] opacity-60">Chat with your mail agent</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Minimize chat"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-muted/10"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  aria-label="Close chat"
                  onClick={() => {
                    // clear messages and close
                    setChatState({ messages: [], isLoading: false })
                    setIsOpen(false)
                  }}
                  className="p-2 rounded-md hover:bg-muted/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">
              {chatState.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Assistant (left) */}
                  {msg.role === "assistant" && (
                    <div className="flex items-end">
                      <Avatar className="w-9 h-9 mr-2">
                        <AvatarFallback>
                          <Bot className={`w-4 h-4 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  <div className={`p-3 rounded-2xl max-w-[78%] leading-relaxed shadow ${msg.role === 'user' ? userBubble : assistantBubble} ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
                    <p className="text-sm font-medium break-words whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* User (right) */}
                  {msg.role === "user" && (
                    <div className="flex items-end">
                      <Avatar className="w-9 h-9 ml-2">
                        <AvatarFallback>
                          <User className={`w-4 h-4 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              ))}

              {chatState.isLoading && (
                <div className="flex items-center gap-3 justify-start">
                  <Avatar className="w-9 h-9 mr-2">
                    <AvatarFallback>
                      <Bot className={`w-4 h-4 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${assistantBubble} rounded-xl px-3 py-2 flex items-center space-x-2`}>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className={`p-4 border-t ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white/40'}`}>
              <div className="flex items-center gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className={`min-h-[60px] resize-none rounded-xl ${isDark ? 'bg-white/6 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500'}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || chatState.isLoading}
                  className={`rounded-full h-[60px] w-[60px] ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} transition-transform duration-150 hover:scale-105`}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              {chatState.error && (
                <p className="text-sm text-red-400 mt-2">{chatState.error}</p>
              )}
            </form>
          </Card>
        )}
      </div>
    </ChatContext.Provider>
  )
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="currentColor" />
    </svg>
  )
}
