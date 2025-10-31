"use client"

import React, { useState, useRef, useEffect } from "react"
import { Send, User, Bot, X, Minimize2, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type ChatMessage, type ChatState } from "@/types/chat"
import { ChatContext } from "@/contexts/chat-context"
import type { PropsWithChildren } from "react"
import { Email, SentMail } from "@/mastra/agents/inbox-agent"
import { set } from "zod/v4"

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
  const { toast } = useToast();

  // State Variables for rendering results
  const [drafts, setDrafts] = useState<Email[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [importantMails, setImportantMails] = useState<Email[]>([]);
  const [sentMails, setSentMails] = useState<Email[]>([]);

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

      if (payload?.toolName === "sendMailTool" && result?.sentEmails) {
        console.log("Sent mail details:", result);
        // Convert the sent emails to the correct format
        const formattedEmails: Email[] = result.sentEmails.map((email: any) => ({
          id: email.id,
          subject: email.mail.subject,
          from: email.mail.from,
          to: email.mail.to,
          snippet: email.mail.snippet,
          timestamp: email.mail.timestamp,
          threadId: email.threadId,
          labelIds: email.labelIds,
          status: email.status
        }));
        console.log("Formatted sent emails:", formattedEmails);
        setSentMails(formattedEmails);
      }

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
            setImportantMails(result.ImportantEmails);
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
          else if (payload.toolName === "unsubscribeTool" && result?.status === "success") {
            // Show modern toast notification for successful unsubscribe
            toast({
              title: "Unsubscribed Successfully!",
              description: `You have been unsubscribed from the mailing list. Message ID: ${result.messageId}`,
              action: (
                <div className="mt-2">
                  <button 
                    onClick={() => console.log("Undo unsubscribe")}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Undo
                  </button>
                </div>
              )
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
    importantMails,
    setImportantMails,
    sentMails,
    setSentMails,
    sendMessage,
  }

  return (
    <ChatContext.Provider value={ctxValue}>
      {children}
      <div className="fixed z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 z-50 active:scale-95"
            title="Open AI Assistant"
          >
            <ChatIcon />
          </button>
        ) : (
          <div className="fixed bottom-0 right-0 w-96 h-screen max-h-[85%] bg-background border-l border-border shadow-2xl flex flex-col z-50 rounded-l-2xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={18} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    setChatState({ messages: [], isLoading: false })
                    setIsOpen(false)
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" ref={scrollRef}>
              {chatState.messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg text-sm ${message.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                      }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-muted-foreground"}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {chatState.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-background px-6 py-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-full bg-muted px-6 py-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                  disabled={!input.trim() || chatState.isLoading}
                  className="h-[56px] w-[56px] flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white transition-colors active:scale-95"
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
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
