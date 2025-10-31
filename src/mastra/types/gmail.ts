import { timeStamp } from 'console';
import { z } from 'zod';

// Email Schema
export const EmailDetailsSchema = z.object({
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  body: z.string(),
  timestamp: z.string()
});

// // Sent Message Output Schema
// export const SendMessageOutputSchema = z.object({
//   id: z.string(),
//   threadId: z.string().optional(),
//   labelIds: z.array(z.string()).optional(),
//   status: z.string(),
//   mail: EmailDetailsSchema
// });

// Draft Email Schema
export const DraftEmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  snippet: z.string(),
});


export const SentMail = z.object({
  subject:z.string(),
  from:z.string(),
  to:z.string(),
  snippet:z.string(),
  timestamp:z.string().optional(),
})




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
  mail:SentMail ,
});

// Types
export type DraftEmail = z.infer<typeof DraftEmailSchema>;
export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>;
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
export type DraftListOutput = z.infer<typeof DraftListOutputSchema>;
export type CreateDraftOutput = z.infer<typeof CreateDraftOutputSchema>;
export type UpdateDraftOutput = z.infer<typeof CreateDraftOutputSchema>;
// export type SendMessageOutput = z.infer<typeof DraftEmailSchema>;
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;
export type DeleteDraftInput = z.infer<typeof DeleteDraftInputSchema>;
export type DeleteDraftOutput = z.infer<typeof DeleteDraftOutputSchema>;