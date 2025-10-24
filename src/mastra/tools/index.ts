import { createTool } from '@mastra/core/tools';
import { WeatherToolResultSchema } from '../types/types';
import { 
  FetchEmailsInputSchema,
  FetchEmailsOutputSchema,
  FetchPrioritizedEmailsInputSchema,
  FetchPrioritizedEmailsOutputSchema
} from '../types/types';
import {
  CreateDraftInputSchema,
  SendMessageInputSchema,
  
  CreateDraftOutputSchema,
  SendMessageOutputSchema,
  DraftListOutputSchema
} from '../types/gmail';
import { getWeather } from '../functions/weather_agent_funcs';
import z from "zod"
import { 
  getUnreadEmails, 
  getPrioritizedEmails,
  getDraftEmails,
  createDraft,
  sendMessage
} from '../functions/personal_agent_funcs';
import { unsubscribeFromSender } from '../functions/personal_agent_funcs';
import { UnsubscribeInputSchema, UnsubscribeOutputSchema } from '../types/types';

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  outputSchema: WeatherToolResultSchema,
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});



export const emailTool = createTool({
  id: "fetchEmails",
  description: "Retrieve unread Gmail messages. Use this when user asks to check, view, or get their unread emails. Supports custom search queries and limiting number of results.",
  inputSchema: FetchEmailsInputSchema,
  outputSchema: FetchEmailsOutputSchema,
  execute: async ({ context }) => {
    console.log("Executing email tool")
    const emails = await getUnreadEmails(context.maxResults, context.query);
    return { emails };
  },
});

export const prioritizedEmailTool = createTool({
  id: "fetchPrioritizedEmails",
  description: "Get unread emails sorted by importance using AI and heuristics. Use this when user wants to see their most important or urgent emails first, or needs help managing email overload.",
  inputSchema: FetchPrioritizedEmailsInputSchema,
  outputSchema: FetchPrioritizedEmailsOutputSchema,
  execute: async ({ context }) => {
    console.log("Executing prioritized email tool");
    const emails = await getPrioritizedEmails(context.maxResults);
    return { emails };
  },
});

export const unsubscribeTool = createTool({
  id: 'unsubscribeEmail',
  description: 'Unsubscribe from email newsletters or mailing lists. Use this when user wants to stop receiving emails from a specific sender. Handles both List-Unsubscribe headers and common unsubscribe patterns.',
  inputSchema: UnsubscribeInputSchema,
  outputSchema: UnsubscribeOutputSchema,
  execute: async ({ context }) => {
    const res = await unsubscribeFromSender(context.messageId);
    return res;
  },
});

export const getDraftsTool = createTool({
  id: 'getDrafts',
  description: 'Retrieve Gmail draft messages. Use this when user wants to see, list, or manage their email drafts. Shows draft subject, sender, and preview.',
  inputSchema: z.object({
    maxResults: z.number().optional().default(10).describe('Maximum number of drafts to return')
  }),
  outputSchema: DraftListOutputSchema,
  execute: async ({ context }) => {
    const drafts = await getDraftEmails(context.maxResults);
    return drafts;
  },
});

export const createDraftTool = createTool({
  id: 'createDraft',
  description: 'Create a new Gmail draft message. Use this when user wants to compose or start a new email without sending it immediately. Supports both simple text messages and raw MIME messages.',
  inputSchema: CreateDraftInputSchema,
  outputSchema: CreateDraftOutputSchema,
  execute: async ({ context }) => {
    const draft = await createDraft(context);
    return draft;
  },
});

export const sendMessageTool = createTool({
  id: 'sendMessage',
  description: 'Send a new Gmail message immediately. Use this when user wants to send an email right away. Supports both simple text messages and raw MIME messages.',
  inputSchema: SendMessageInputSchema,
  outputSchema: SendMessageOutputSchema,
  execute: async ({ context }) => {
    const message = await sendMessage(context);
    return message;
  },
});

