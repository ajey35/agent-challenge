"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState, useEffect } from "react";

// Gmail interfaces
interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  priority?: number;
  reasoning?: string;
  received?: string;
}

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useCopilotAction({
    name: "setThemeColor",
    parameters: [{
      name: "themeColor",
      description: "The theme color to set. Make sure to pick nice colors.",
      required: true,
    }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  return (
    <main 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}
      style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}
    >
      <GmailInterface themeColor={themeColor} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Gmail Assistant",
          initial: "👋 Hi! I'm your Gmail assistant. I can help you with:\n\n- **Email Management**: Check unread emails, sort by priority\n- **Draft Management**: View, create, and send drafts\n- **Unsubscribe**: Easily unsubscribe from newsletters\n- **Compose**: Create and send new emails\n\nTry saying:\n- \"Show me my important emails\"\n- \"Create a new draft\"\n- \"Unsubscribe from newsletter@example.com\"\n- \"Send an email to...\""
        }}
      />
    </main>
  );
}

function GmailInterface({ themeColor, isDarkMode, setIsDarkMode }: { 
  themeColor: string; 
  isDarkMode: boolean; 
  setIsDarkMode: (value: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'drafts' | 'compose'>('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Email-related actions (must match tool IDs exported by the MCP)
  useCopilotAction({
    name: "fetchPrioritizedEmails", // tool id in src/mastra/tools/index.ts
    description: "Get and display prioritized unread emails",
    available: "frontend",
    parameters: [
      { name: "maxResults", type: "number", required: false },
    ],
    render: ({ result, status }) => {
      setIsLoading(status !== 'complete');
      return (
        <EmailList 
          emails={result?.emails || []} 
          loading={status !== 'complete'}
          themeColor={themeColor}
          isDarkMode={isDarkMode}
        />
      );
    },
  });

  useCopilotAction({
    name: "getDrafts", // tool id in src/mastra/tools/index.ts
    description: "Get and display draft emails",
    available: "frontend",
    parameters: [
      { name: "maxResults", type: "number", required: false },
    ],
    render: ({ result, status }) => {
      setIsLoading(status !== 'complete');
      return (
        <DraftsList 
          drafts={Array.isArray(result) ? result : (result?.drafts || [])} 
          loading={status !== 'complete'}
          themeColor={themeColor}
          isDarkMode={isDarkMode}
        />
      );
    },
  });

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: themeColor }}
          >
            G
          </div>
          <h1 className="text-lg font-bold">Gmail Assistant</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`${
        sidebarOpen ? 'block' : 'hidden'
      } lg:block w-full lg:w-64 p-4 lg:p-6 border-r transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-6">
          {/* Logo/Header */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: themeColor }}
            >
              G
            </div>
            <div>
              <h1 className="text-xl font-bold">Gmail Assistant</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Email Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <TabButton 
              active={activeTab === 'inbox'} 
              onClick={() => setActiveTab('inbox')}
              themeColor={themeColor}
              isDarkMode={isDarkMode}
              icon="📥"
            >
              Inbox
            </TabButton>
            <TabButton 
              active={activeTab === 'drafts'} 
              onClick={() => setActiveTab('drafts')}
              themeColor={themeColor}
              isDarkMode={isDarkMode}
              icon="📝"
            >
              Drafts
            </TabButton>
            <TabButton 
              active={activeTab === 'compose'} 
              onClick={() => setActiveTab('compose')}
              themeColor={themeColor}
              isDarkMode={isDarkMode}
              icon="✉️"
            >
              Compose
            </TabButton>
          </nav>

          {/* Stats */}
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <h3 className="text-sm font-medium mb-2">Quick Stats</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Unread:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span>Drafts:</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 lg:p-6 border-b transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
              <p className="text-muted-foreground">
                {activeTab === 'inbox' && 'Manage your important emails'}
                {activeTab === 'drafts' && 'Review and edit your drafts'}
                {activeTab === 'compose' && 'Create and send new emails'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'inbox' && <InboxView themeColor={themeColor} isDarkMode={isDarkMode} />}
            {activeTab === 'drafts' && <DraftsView themeColor={themeColor} isDarkMode={isDarkMode} />}
            {activeTab === 'compose' && <ComposeView themeColor={themeColor} isDarkMode={isDarkMode} />}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 border-t p-2 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeTab === 'inbox' 
                  ? 'text-white' 
                  : 'text-muted-foreground'
              }`}
              style={{ backgroundColor: activeTab === 'inbox' ? themeColor : undefined }}
            >
              <span className="text-lg">📥</span>
              <span className="text-xs font-medium">Inbox</span>
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeTab === 'drafts' 
                  ? 'text-white' 
                  : 'text-muted-foreground'
              }`}
              style={{ backgroundColor: activeTab === 'drafts' ? themeColor : undefined }}
            >
              <span className="text-lg">📝</span>
              <span className="text-xs font-medium">Drafts</span>
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all ${
                activeTab === 'compose' 
                  ? 'text-white' 
                  : 'text-muted-foreground'
              }`}
              style={{ backgroundColor: activeTab === 'compose' ? themeColor : undefined }}
            >
              <span className="text-lg">✉️</span>
              <span className="text-xs font-medium">Compose</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  children, 
  active, 
  onClick,
  themeColor,
  isDarkMode,
  icon
}: { 
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  themeColor: string;
  isDarkMode: boolean;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'text-white shadow-lg' 
          : `text-muted-foreground hover:text-foreground hover:bg-accent ${
              isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
            }`
      }`}
      style={{ 
        backgroundColor: active ? themeColor : undefined,
        transform: active ? 'translateX(4px)' : 'translateX(0)'
      }}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="font-medium">{children}</span>
    </button>
  );
}

function InboxView({ themeColor, isDarkMode }: { themeColor: string; isDarkMode: boolean }) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`p-6 rounded-xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50'
      } border`}>
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: themeColor }}
          >
            📥
          </div>
          <div>
            <h3 className="text-lg font-semibold">Smart Inbox</h3>
            <p className="text-muted-foreground">
              AI-powered email prioritization helps you focus on what matters most
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: themeColor }}
        >
          <span>🔄</span>
          <span>Refresh Inbox</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all hover:shadow-lg ${
            isDarkMode 
              ? 'border-slate-600 hover:bg-slate-700' 
              : 'border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span>⚡</span>
          <span>Quick Actions</span>
        </button>
      </div>

      {/* Email List Container */}
      <div className="space-y-4">
        {/* Emails will be rendered here by prioritizedEmailTool */}
      </div>
    </div>
  );
}

function DraftsView({ themeColor, isDarkMode }: { themeColor: string; isDarkMode: boolean }) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`p-6 rounded-xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-gradient-to-r from-amber-50 to-orange-50'
      } border`}>
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: themeColor }}
          >
            📝
          </div>
          <div>
            <h3 className="text-lg font-semibold">Draft Messages</h3>
            <p className="text-muted-foreground">
              Review and manage your saved email drafts
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: themeColor }}
        >
          <span>🔄</span>
          <span>Refresh Drafts</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all hover:shadow-lg ${
            isDarkMode 
              ? 'border-slate-600 hover:bg-slate-700' 
              : 'border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span>📝</span>
          <span>New Draft</span>
        </button>
      </div>

      {/* Drafts List Container */}
      <div className="space-y-4">
        {/* Drafts will be rendered here by getDraftsTool */}
      </div>
    </div>
  );
}

function ComposeView({ themeColor, isDarkMode }: { themeColor: string; isDarkMode: boolean }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);

  useCopilotAction({
    name: "createDraft",
    available: "frontend",
    render: ({ status }) => {
      if (status === "complete") setSavingDraft(false);
      return (
        <div style={{ display: 'none' }} />
      );
    },
  });

  useCopilotAction({
    name: "sendMessage",
    available: "frontend",
    render: ({ status }) => {
      if (status === "complete") setSending(false);
      return (
        <div style={{ display: 'none' }} />
      );
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`p-6 rounded-xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-gradient-to-r from-green-50 to-emerald-50'
      } border`}>
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: themeColor }}
          >
            ✉️
          </div>
          <div>
            <h3 className="text-lg font-semibold">Compose Email</h3>
            <p className="text-muted-foreground">
              Create and send professional emails with AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Email Form */}
      <div className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium mb-2">To</label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`w-full p-3 rounded-lg border transition-all focus:ring-2 focus:ring-offset-2 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 focus:border-blue-500' 
                  : 'bg-white border-slate-300 focus:border-blue-500'
              }`}
              style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            />
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full p-3 rounded-lg border transition-all focus:ring-2 focus:ring-offset-2 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 focus:border-blue-500' 
                  : 'bg-white border-slate-300 focus:border-blue-500'
              }`}
              style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              placeholder="Type your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={`w-full p-3 rounded-lg border transition-all focus:ring-2 focus:ring-offset-2 resize-none ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 focus:border-blue-500' 
                  : 'bg-white border-slate-300 focus:border-blue-500'
              }`}
              style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => setSavingDraft(true)}
              disabled={savingDraft}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border transition-all hover:shadow-lg disabled:opacity-50 ${
                isDarkMode 
                  ? 'border-slate-600 hover:bg-slate-700' 
                  : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              {savingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Draft</span>
                </>
              )}
            </button>
            <button
              onClick={() => setSending(true)}
              disabled={sending || !to || !subject || !body}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailList({ 
  emails, 
  loading,
  themeColor,
  isDarkMode
}: { 
  emails: Email[];
  loading: boolean;
  themeColor: string;
  isDarkMode: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`animate-pulse p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-3">
              <div className="h-4 bg-slate-300 rounded w-3/4"></div>
              <div className="h-3 bg-slate-300 rounded w-1/2"></div>
              <div className="h-3 bg-slate-300 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email, index) => (
        <div 
          key={email.id}
          className={`p-6 rounded-xl border transition-all hover:shadow-lg animate-fade-in ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{email.subject}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{email.from}</p>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 line-clamp-2">{email.snippet}</p>
              {email.reasoning && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                }`}>
                  <p className="text-sm text-muted-foreground italic">
                    <span className="font-medium">AI Insight:</span> {email.reasoning}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {email.priority && (
                <div 
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: themeColor }}
                >
                  Priority {Math.round(email.priority)}
                </div>
              )}
              <button
                className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  // Trigger unsubscribe action
                }}
              >
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      ))}
      {emails.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-semibold mb-2">No emails to display</h3>
          <p className="text-muted-foreground">Your inbox is empty! 🎉</p>
        </div>
      )}
    </div>
  );
}

function DraftsList({ 
  drafts, 
  loading,
  themeColor,
  isDarkMode
}: { 
  drafts: Email[];
  loading: boolean;
  themeColor: string;
  isDarkMode: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`animate-pulse p-4 rounded-xl border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-3">
              <div className="h-4 bg-slate-300 rounded w-3/4"></div>
              <div className="h-3 bg-slate-300 rounded w-1/2"></div>
              <div className="h-3 bg-slate-300 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => (
        <div 
          key={draft.id}
          className={`p-6 rounded-xl border transition-all hover:shadow-lg animate-fade-in ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {draft.subject || 'No Subject'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {draft.from || 'No recipient'}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-3 line-clamp-2">{draft.snippet}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg"
                style={{ backgroundColor: themeColor }}
              >
                Edit Draft
              </button>
              <button
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:shadow-lg"
                style={{ 
                  borderColor: themeColor,
                  color: themeColor
                }}
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      ))}
      {drafts.length === 0 && (
        <div className={`text-center py-12 rounded-xl border ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
          <p className="text-muted-foreground">Start composing to create your first draft!</p>
        </div>
      )}
    </div>
  );
}
