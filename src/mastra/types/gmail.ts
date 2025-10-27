import { z } from 'zod';

// Draft Email Schema
export const DraftEmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to : z.string(),
  snippet: z.string(),
});



// Create Draft Input Schema
export const CreateDraftInputSchema = z.object({
  userId: z.string().default('me'),
  to: z.string().optional(),
  subject: z.string().optional(),
  snippet: z.string().optional(),
}).refine(
  data => !!((data.to && data.subject && data.snippet)),
  { message: "Either 'raw' or (to, subject, body) must be provided" }
);


// Update Draft Input Schema
export const UpdateDraftInputSchema = z.object({
  userId: z.string().default('me'),
  id: z.string(), // draft id (required for update)
  to: z.string(),
  subject: z.string(),
  snippet: z.string(),
});

export const UpdateDraftOutputSchema = z.object({
  userId: z.string().default('me'),
  id: z.string(), // draft id (required for update)
  to: z.string(),
  subject: z.string(),
  snippet: z.string(),
});


export const UpdateAndSendDraftOutputSchema = z.object({
  userId: z.string().default('me'),
  id: z.string(), // draft id (required for update)
  to: z.string(),
  subject: z.string(),
  snippet: z.string(),
  status: z.enum(["send-successfully", "not able to send", "updated but not send "])
});

export const DeleteDraftInputSchema = z.object({
  userId: z.string().default('me'),
  id: z.string(), // draft id to delete
});

export const DeleteDraftOutputSchema = z.object({
  success: z.boolean(),
  id: z.string(),
  message: z.string().optional(),
});


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
export type UpdateDraftOutput = z.infer<typeof CreateDraftOutputSchema>;
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;
export type DeleteDraftInput = z.infer<typeof DeleteDraftInputSchema>;
export type DeleteDraftOutput = z.infer<typeof DeleteDraftOutputSchema>;