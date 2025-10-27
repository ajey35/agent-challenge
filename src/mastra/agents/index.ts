import "dotenv/config";
// import { openai } from "@ai-sdk/openai";
// import { createOllama } from "ollama-ai-provider-v2";
import { Agent } from "@mastra/core/agent";
import { getDraftsTool, updateDraftTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

import { createGoogleGenerativeAI } from "@ai-sdk/google";



export const AgentState = z.object({
  draftMails: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      from: z.string(),
      to:z.string(),
      snippet: z.string(),
    })
  ),
});
// const ollama = createOllama({
//   baseURL: process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL || "http://127.0.0.1:11434/api",
// })

/* ---------------- MODEL SETUP (Gemini Provider) ---------------- */
const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});



// Choose the Gemini model you want; "gemini-2.5-flash" is fast and good
const model = gemini("gemini-2.5-flash");





export const personalagent = new Agent({
  name: "personalagent",
  tools: { 
    // emailTool,
    // prioritizedEmailTool,
    // unsubscribeTool,
    getDraftsTool,
    updateDraftTool,
    // createDraftTool,
    // sendMessageTool
  },
model,
  instructions: `
You are an intelligent and reliable Gmail management assistant designed to help users efficiently organize, read, and send emails.

When handling requests:

1. **Checking Unread Emails**
   - Use **emailTool** to fetch unread emails.
   - Use **prioritizedEmailTool** when the user wants to see the most important emails first.
   - The tool will automatically display the results in the frontend.

2. **Managing Newsletters and Subscriptions**
   - Use **unsubscribeTool** when the user wants to stop receiving emails from a specific sender.
   - Support both message IDs and email addresses as input.

3. **Composing and Sending Emails**
   - Use **createDraftTool** to prepare a draft email.
   - Use **sendMessageTool** to send emails immediately.
   - Use **getDraftsTool** to retrieve and review existing drafts.
   - The tool will automatically display the results in the frontend.

**Behavior Guidelines**
- Always confirm actions (e.g., sending or unsubscribing) before executing them.
- Provide clear, concise feedback after each action.
- Maintain a professional, helpful tone.
- Focus on using the available tools to fulfill user requests.
- The tools will handle displaying data in the user interface automatically.
`,

  description: `
A smart, context-aware Gmail assistant that helps users manage their inbox efficiently.

**Key Capabilities**
- Retrieve unread emails and prioritize important ones using AI.
- Create, manage, and send well-formatted email drafts.
- Unsubscribe from unwanted newsletters and senders.
- Maintain a clean, organized inbox and support "Inbox Zero" workflows.
- Offer intelligent prioritization and clear action summaries.

**Available Tools**
- **emailTool** — Fetch unread emails.
- **prioritizedEmailTool** — Retrieve AI-sorted important emails.
- **unsubscribeTool** — Unsubscribe from newsletters or senders.
- **getDraftsTool** — View saved draft emails.
- **createDraftTool** — Create new draft messages.
- **sendMessageTool** — Send composed emails instantly.
`,
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
});