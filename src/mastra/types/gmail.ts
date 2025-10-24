import { z } from 'zod';

// Draft Email Schema
export const DraftEmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  snippet: z.string(),
});

// Create Draft Input Schema
export const CreateDraftInputSchema = z.object({
  userId: z.string().default('me'),
  raw: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
}).refine(
  data => !!(data.raw || (data.to && data.subject && data.body)),
  { message: "Either 'raw' or (to, subject, body) must be provided" }
);

// Send Message Input Schema
export const SendMessageInputSchema = CreateDraftInputSchema;

// Output Schemas
export const DraftListOutputSchema = z.array(DraftEmailSchema);
export const CreateDraftOutputSchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    threadId: z.string().optional(),
  }),
});
export const SendMessageOutputSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

// Types
export type DraftEmail = z.infer<typeof DraftEmailSchema>;
export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>;
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
export type DraftListOutput = z.infer<typeof DraftListOutputSchema>;
export type CreateDraftOutput = z.infer<typeof CreateDraftOutputSchema>;
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;