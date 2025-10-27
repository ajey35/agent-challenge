import { z } from 'zod';




export const FetchEmailsInputSchema = z.object({
  maxResults: z
    .number()
    .default(10)
    .describe("Maximum number of unread emails to fetch"),
  query: z
    .string()
    .default("is:unread")
    .describe("Gmail search query (optional)"),
});

/**
 * Output Schema
 * Each email has id, subject, from, and snippet.
 */
export const EmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  snippet: z.string(),
});

export const PrioritizedEmailSchema = EmailSchema.extend({
  priority: z.number(),
  received: z.string(),
});

export const FetchEmailsOutputSchema = z.object({
  emails: z.array(EmailSchema),
});

export const FetchPrioritizedEmailsInputSchema = z.object({
  maxResults: z
    .number()
    .default(10)
    .describe("Maximum number of unread emails to fetch and prioritize"),
});

export const FetchPrioritizedEmailsOutputSchema = z.object({
  emails: z.array(PrioritizedEmailSchema),
});

// Unsubscribe schemas
export const UnsubscribeInputSchema = z.object({
  messageId: z.string().describe('Gmail message ID to unsubscribe'),
});

export const UnsubscribeOutputSchema = z.object({
  success: z.boolean(),
  method: z.string(),
  address: z.string().optional(),
  url: z.string().optional(),
});


