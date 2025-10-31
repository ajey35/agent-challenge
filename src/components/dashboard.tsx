"use client"

import { useState } from "react"
import { type Email } from "@/mastra/agents/inbox-agent"
import InboxContainer from "./inbox-container"
import DraftsContainer from "./drafts-container"
import ChatInterface from "./chat-interface"
import Sidebar from "./sidebar"
import ComposeModal from "./compose-modal"
import SentView from "./sent-view"
import { LogOut, Settings, Search, HelpCircle, Grid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import EmailViewerModal from "./email-viewer-modal"

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("inbox:unread")
  const [selectedItem, setSelectedItem] = useState<Email | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [inboxSection, setInboxSection] = useState<string | undefined>(undefined)
  return (
    <div className="h-screen w-screen flex bg-background">
      <Sidebar
        onCompose={() => setShowCompose(true)}
        onLogout={onLogout}
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
              {activeTab === "sent" && (
                <SentView onEmailSelect={setSelectedItem} />
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




