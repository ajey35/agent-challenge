import { z } from "zod";

export const SentMailSchema = z.object({
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  snippet: z.string(),
  timestamp: z.string()
});

export const SentEmailSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  status: z.string(),
  mail: SentMailSchema
});

export const SendMessageInputSchema = z.object({
  prompt: z.string().describe("The prompt to generate and send the email")
});

export const SendMessageOutputSchema = z.object({
  status: z.string(),
  newMailId: z.string(),
  sentEmails: z.array(SentEmailSchema)
});

export type SentMail = z.infer<typeof SentMailSchema>;
export type SentEmail = z.infer<typeof SentEmailSchema>;
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;