"use client"

import React from "react"
import { Mail, Star, FileText, Send, Trash2, Plus, LogOut } from "lucide-react"

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
  onLogout: () => void
}

const DEFAULT_MENU: MenuItem[] = [
  { id: "inbox", label: "Inbox", icon: Mail, badge: 0 },
  { id: "starred", label: "Starred", icon: Star },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "sent", label: "Sent", icon: Send },
  { id: "trash", label: "Trash", icon: Trash2 },
]
import { ThemeToggle } from "./theme-toggle"

export function Sidebar({ onCompose, activeMenu, onMenuChange, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Gmail Logo */}
            <svg viewBox="0 0 24 24" className="h-8 w-8">
              <path fill="#EA4335" d="M24 9.5c0-.69-.07-1.35-.2-2H12v4h7c-.3 1.6-1.1 3-2.3 3.9v3.3h3.7c2.2-2 3.5-4.9 3.5-8.3z"/>
              <path fill="#4285F4" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-3.3c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H2.2v3.4C4 21.2 7.7 24 12 24z"/>
              <path fill="#FBBC05" d="M5.6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.3H2.2C1.4 7.9 1 9.9 1 12s.4 4.1 1.2 5.7l3.4-3.4z"/>
              <path fill="#34A853" d="M12 5.3c1.7 0 3.2.6 4.4 1.6L19.7 4c-2.2-2-5-3-7.7-3C7.7 1 4 3.8 2.2 7.7l3.4 3.4c.9-2.7 3.4-4.7 6.4-4.7z"/>
            </svg>
            <span className="text-xl font-normal text-foreground">Gmail</span>
          </div>
          <ThemeToggle />
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

      <div className="p-4 border-t border-border space-y-3 flex-shrink-0">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-colors text-sm">
          <Plus className="w-4 h-4" />
          New label
        </button>

        <div className="flex items-center justify-between px-2">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
          <button className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-shadow">
            A
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
