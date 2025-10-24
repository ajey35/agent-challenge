"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";

// Gmail interfaces
interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  priority?: number;
  reasoning?: string;
}

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

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
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <GmailInterface themeColor={themeColor} />
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

function GmailInterface({ themeColor }: { themeColor: string }) {
  const [activeTab, setActiveTab] = useState<'inbox' | 'drafts' | 'compose'>('inbox');

  // Email-related actions (must match tool IDs exported by the MCP)
  useCopilotAction({
    name: "fetchPrioritizedEmails", // tool id in src/mastra/tools/index.ts
    description: "Get and display prioritized unread emails",
    available: "frontend",
    parameters: [
      { name: "maxResults", type: "number", required: false },
    ],
    render: ({ result, status }) => (
      <EmailList 
        emails={result?.emails || []} 
        loading={status !== 'complete'}
        themeColor={themeColor}
      />
    ),
  });

  useCopilotAction({
    name: "getDrafts", // tool id in src/mastra/tools/index.ts
    description: "Get and display draft emails",
    available: "frontend",
    parameters: [
      { name: "maxResults", type: "number", required: false },
    ],
    render: ({ result, status }) => (
      <DraftsList 
        drafts={Array.isArray(result) ? result : (result?.drafts || [])} 
        loading={status !== 'complete'}
        themeColor={themeColor}
      />
    ),
  });

  return (
    <div className="h-screen w-screen flex justify-center items-start p-8">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Gmail Management</h1>
            <div className="flex gap-2">
              <TabButton 
                active={activeTab === 'inbox'} 
                onClick={() => setActiveTab('inbox')}
                themeColor={themeColor}
              >
                Inbox
              </TabButton>
              <TabButton 
                active={activeTab === 'drafts'} 
                onClick={() => setActiveTab('drafts')}
                themeColor={themeColor}
              >
                Drafts
              </TabButton>
              <TabButton 
                active={activeTab === 'compose'} 
                onClick={() => setActiveTab('compose')}
                themeColor={themeColor}
              >
                Compose
              </TabButton>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {activeTab === 'inbox' && <InboxView themeColor={themeColor} />}
          {activeTab === 'drafts' && <DraftsView themeColor={themeColor} />}
          {activeTab === 'compose' && <ComposeView themeColor={themeColor} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  children, 
  active, 
  onClick,
  themeColor 
}: { 
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  themeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-all ${
        active 
          ? 'text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      style={{ backgroundColor: active ? themeColor : undefined }}
    >
      {children}
    </button>
  );
}

function InboxView({ themeColor }: { themeColor: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Priority Inbox</h2>
        <button
          className="px-4 py-2 rounded-lg text-white transition-all"
          style={{ backgroundColor: themeColor }}
        >
          Refresh
        </button>
      </div>
      {/* Emails will be rendered here by prioritizedEmailTool */}
    </div>
  );
}

function DraftsView({ themeColor }: { themeColor: string }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Draft Messages</h2>
        <button
          className="px-4 py-2 rounded-lg text-white transition-all"
          style={{ backgroundColor: themeColor }}
        >
          Refresh Drafts
        </button>
      </div>
      {/* Drafts will be rendered here by getDraftsTool */}
    </div>
  );
}

function ComposeView({ themeColor }: { themeColor: string }) {
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
    <div className="space-y-4">
      <input
        type="email"
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="w-full p-3 border rounded-lg"
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full p-3 border rounded-lg"
      />
      <textarea
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        className="w-full p-3 border rounded-lg resize-none"
      />
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setSavingDraft(true)}
          disabled={savingDraft}
          className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-all"
        >
          {savingDraft ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => setSending(true)}
          disabled={sending}
          className="px-4 py-2 rounded-lg text-white transition-all"
          style={{ backgroundColor: themeColor }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function EmailList({ 
  emails, 
  loading,
  themeColor 
}: { 
  emails: Email[];
  loading: boolean;
  themeColor: string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div 
          key={email.id}
          className="p-4 border rounded-lg hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{email.subject}</h3>
              <p className="text-sm text-gray-600">{email.from}</p>
            </div>
            <div className="flex items-center gap-2">
              {email.priority && (
                <div 
                  className="px-3 py-1 rounded-full text-white text-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  Priority {email.priority}
                </div>
              )}
              <button
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                onClick={() => {
                  // Trigger unsubscribe action
                }}
              >
                Unsubscribe
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">{email.snippet}</p>
          {email.reasoning && (
            <p className="text-sm text-gray-500 mt-2 italic">
              {email.reasoning}
            </p>
          )}
        </div>
      ))}
      {emails.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No emails to display. Your inbox is empty!
        </p>
      )}
    </div>
  );
}

function DraftsList({ 
  drafts, 
  loading,
  themeColor 
}: { 
  drafts: Email[];
  loading: boolean;
  themeColor: string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((draft) => (
        <div 
          key={draft.id}
          className="p-4 border rounded-lg hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{draft.subject || 'No Subject'}</h3>
              <p className="text-sm text-gray-600">{draft.from || 'No recipient'}</p>
            </div>
            <button
              className="px-3 py-1 rounded-lg text-white text-sm"
              style={{ backgroundColor: themeColor }}
            >
              Edit
            </button>
          </div>
          <p className="text-gray-600 mt-2">{draft.snippet}</p>
        </div>
      ))}
      {drafts.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No drafts found. Start composing to create one!
        </p>
      )}
    </div>
  );
}
