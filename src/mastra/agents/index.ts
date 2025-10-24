import "dotenv/config";
// import { openai } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider-v2";
import { Agent } from "@mastra/core/agent";
import { 
  weatherTool,
  emailTool,
  prioritizedEmailTool,
  unsubscribeTool,
  getDraftsTool,
  createDraftTool,
  sendMessageTool
} from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

export const AgentState = z.object({
  proverbs: z.array(z.string()).default([]),
});

const ollama = createOllama({
  baseURL: process.env.NOS_OLLAMA_API_URL || process.env.OLLAMA_API_URL,
})

export const weatherAgent = new Agent({
  name: "Weather Agent",
  tools: { weatherTool },
  // model: openai("gpt-4o"), // uncomment this line to use openai
  model: ollama(process.env.NOS_MODEL_NAME_AT_ENDPOINT || process.env.MODEL_NAME_AT_ENDPOINT || "qwen3:8b"), // comment this line to use openai
  instructions: "You are a helpful assistant.",
  description: "An agent that can get the weather for a given location.",
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
})



export const PersonalAgent = new Agent({
  name: "Personal Email Assistant",
  tools: { 
    emailTool,
    prioritizedEmailTool,
    unsubscribeTool,
    getDraftsTool,
    createDraftTool,
    sendMessageTool
  },
  model: ollama(process.env.NOS_MODEL_NAME_AT_ENDPOINT || process.env.MODEL_NAME_AT_ENDPOINT || "qwen3:8b"),
  instructions: `You are an intelligent email management assistant that helps users handle their Gmail inbox efficiently.

When the user makes a request:
1. For checking unread emails:
   - Use emailTool for basic inbox checking
   - Use prioritizedEmailTool when they want important emails first

2. For managing newsletters/subscriptions:
   - Use unsubscribeTool when they want to stop receiving emails from a sender
   - Handle both message IDs and email addresses

3. For composing emails:
   - Use createDraftTool when they want to prepare an email
   - Use sendMessageTool when they want to send immediately
   - Use getDraftsTool when they want to see saved drafts

Always confirm actions before executing them and provide clear feedback about what was done.`,
  
  description: `A sophisticated email management agent that can:
- Fetch and organize unread emails by importance
- Manage email drafts and compose new messages
- Send emails with proper formatting
- Handle newsletter unsubscriptions
- Provide intelligent email prioritization
- Help users maintain inbox zero

Available tools:
- emailTool: Get unread emails
- prioritizedEmailTool: Get AI-sorted important emails
- unsubscribeTool: Unsubscribe from newsletters
- getDraftsTool: View draft emails
- createDraftTool: Create new draft emails
- sendMessageTool: Send emails immediately`,
  
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
})
