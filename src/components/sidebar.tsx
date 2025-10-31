"use client"

import React from "react"
import { Mail, Star, FileText, Send, Trash2, Plus } from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface SidebarProps {
  onCompose: () => void
  activeMenu: string
  onMenuChange: (id: string) => void
}

const DEFAULT_MENU: MenuItem[] = [
  { id: "inbox", label: "Inbox", icon: Mail, badge: 0 },
  { id: "starred", label: "Starred", icon: Star },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "sent", label: "Sent", icon: Send },
  { id: "trash", label: "Trash", icon: Trash2 },
]

export function Sidebar({ onCompose, activeMenu, onMenuChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="px-4 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            M
          </div>
          <span className="text-lg font-semibold text-foreground">MailAI</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-shrink-0">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 px-4 font-medium transition-all duration-200 hover:shadow-lg active:scale-95"
        >
          <Mail size={18} />
          Compose
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {DEFAULT_MENU.map((item) => {
          const Icon = item.icon
          const active = activeMenu === item.id
          return (
            <div key={item.id}>
              <button
                onClick={() => onMenuChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  active ? "bg-blue-100 text-blue-600 border-l-4 border-blue-600" : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge ? <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-1 font-semibold">{item.badge}</span> : null}
              </button>

              {/* Inbox sub-sections */}
              {item.id === "inbox" && active && (
                <div className="pl-8 pr-4 mt-2 space-y-1">
                  <button
                    onClick={() => onMenuChange("inbox:unread")}
                    className="w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition-colors"
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => onMenuChange("inbox:important")}
                    className="w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition-colors"
                  >
                    Important-Mails
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2 flex-shrink-0">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors text-sm">
          <Plus className="w-4 h-4" />
          New label
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
