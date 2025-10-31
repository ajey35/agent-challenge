"use client"

import { useState } from "react"
import { type Email } from "@/mastra/agents/inbox-agent"
import InboxContainer from "./inbox-container"
import DraftsContainer from "./drafts-container"
import ChatInterface from "./chat-interface"
import Sidebar from "./sidebar"
import ComposeModal from "./compose-modal"
import { Mail, LogOut, Settings, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import EmailViewerModal from "./email-viewer-modal"

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("inbox")
  const [selectedItem, setSelectedItem] = useState<Email | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [inboxSection, setInboxSection] = useState<string | undefined>(undefined)

  

  

  return (
    <div className="h-screen w-screen flex bg-background">
      <Sidebar
        onCompose={() => setShowCompose(true)}
        activeMenu={activeTab}
        onMenuChange={(id: string) => {
          // support inbox sub-sections like "inbox:unread" or "inbox:important"
          if (id.startsWith("inbox:")) {
            setActiveTab("inbox")
            const sec = id.split(":")[1]
            if (sec === "unread") setInboxSection("Un-Read")
            else if (sec === "important") setInboxSection("Important-Mails")
            else setInboxSection(undefined)
          } else {
            setInboxSection(undefined)
            setActiveTab(id)
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/50 dark:from-card/50 dark:to-card/30 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GmailAgent
              </h1>
              <p className="text-xs text-muted-foreground">AI-Powered Email Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-all hover:scale-110"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-all hover:scale-110 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 transition-all hover:scale-110"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-all rounded-full ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Content area controlled by Sidebar (no duplicate top tabs) */}
            <div className="flex-1 overflow-auto">
              {activeTab === "inbox" && (
                <InboxContainer onEmailSelect={setSelectedItem} category={inboxSection} />
              )}
              {activeTab === "drafts" && (
                <DraftsContainer onDraftSelect={setSelectedItem} />
              )}
            </div>

            {selectedItem && (
              <EmailViewerModal
                email={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
            )}
          </div>
        </div>
      </div>
      <ComposeModal isOpen={showCompose} onClose={() => setShowCompose(false)} />
    </div>
  )
}




