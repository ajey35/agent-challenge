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
export const CreateDraftInputSchema = z.object({ prompt:z.string().describe("Prompt to Create the Draft Mail"), });


// Update Draft Input Schema
export const UpdateDraftInputSchema = z.object({prompt:z.string().describe("Prompt to Update the Draft Mail"),id: z.string().describe("Draft ID to be updated")});

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
export const SendMessageInputSchema =  z.object({
  prompt:z.string().describe("Prompt to Send the Mail"),
});

// Output Schemas
export const DraftListOutputSchema = z.object({draftMails:z.array(DraftEmailSchema)});
export const CreateDraftOutputSchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    threadId: z.string().optional(),
    mail:DraftEmailSchema
  }),
});
export const SendMessageOutputSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  status: z.string().optional(),
  mail: z.string().optional(),
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