import { createTool } from '@mastra/core/tools';
import { 
  FetchEmailsOutputSchema,
  FetchPrioritizedEmailsInputSchema,
  FetchPrioritizedEmailsOutputSchema
} from '../types/types';
import {
  CreateDraftInputSchema,
  SendMessageInputSchema,
  
  CreateDraftOutputSchema,
  SendMessageOutputSchema,
  DraftListOutputSchema,
  // UpdateAndSendDraftOutputSchema,
  UpdateDraftInputSchema,
  UpdateDraftOutputSchema,
  // DeleteDraftInputSchema,
  DeleteDraftOutputSchema
} from '../types/gmail';
import { 
  getUnreadEmails, 
  getPrioritizedEmails,
  getDraftEmails,
  updateDraftEmail,
  sendMessage,
  createDraft,
  // deleteDraftEmail,
  unsubscribeFromSender
  // sendMessage
} from '../functions/gmail-util-funcs';
import { UnsubscribeInputSchema, UnsubscribeOutputSchema } from '../types/types';

export const getDraftsTool = createTool({
  id: "getEmailDrafts",
  description:
    "Retrieve all saved Gmail drafts. Use this tool when the user asks to 'show drafts', 'list unsent emails', or 'view composed messages not sent yet'. Returns up to 20 draft emails with their metadata.",
  outputSchema: DraftListOutputSchema,
  execute: async () => {
    console.log("Executing: get all drafts");
    const drafts = await getDraftEmails(20);
    return drafts;
  },
});

export const getUnreadEmailTool = createTool({
  id: "getUnreadEmails",
  description:
    "Fetch all unread Gmail messages. Use this tool when the user asks to 'show unread emails', 'check new mail', or 'see unseen messages'. Returns up to 25 unread messages with sender, subject, and snippet.",
  outputSchema: FetchEmailsOutputSchema,
  execute: async () => {
    console.log("Executing: get unread emails");
    const UnReadEmails = await getUnreadEmails(25, "is:unread");
    return { UnReadEmails };
  },
});

export const ImportantEmailsTool = createTool({
  id: "getImportantEmails",
  description:
    "Identify and fetch the most important unread emails using AI-based prioritization. Use this when the user says things like 'show important emails', 'top priority messages', or 'urgent unread mail'. Returns 10 prioritized unread emails ranked by importance.",
  outputSchema: FetchPrioritizedEmailsOutputSchema,
  execute: async () => {
    console.log("Executing: get important emails");
    const ImportantEmails = await getPrioritizedEmails(10);
    return { ImportantEmails };
  },
});

export const createDraftTool = createTool({
  id: "createEmailDraft",
  description:
    "Compose a new Gmail draft. Use this tool when the user says 'draft an email', 'start writing', or 'create a message but don’t send yet'. Accepts a text input with the recipient, subject, and message body. Returns the created draft details.",
  inputSchema: CreateDraftInputSchema,
  outputSchema: CreateDraftOutputSchema,
  execute: async ({ context }) => {
    const draft = await createDraft(context.prompt);
    return draft;
  },
});

export const sendMailTool = createTool({
  id: "sendEmail",
  description:
    "Send a Gmail message immediately. Use this tool when the user says 'send email', 'deliver message', or 'email this person now'. Requires recipient address, subject, and message body. Returns confirmation after successful sending.",
  inputSchema: SendMessageInputSchema,
  outputSchema: SendMessageOutputSchema,
  execute: async ({ context }) => {
    const message = await sendMessage(context.prompt);
    return message;
  },
});

export const unsubscribeTool = createTool({
  id: "unsubscribeFromSender",
  description:
    "Unsubscribe from promotional or newsletter emails. Use this when the user says 'unsubscribe me from...', 'stop receiving mails from...', or 'remove me from this mailing list'. Handles common unsubscribe links and headers automatically. Returns success or failure status.",
  inputSchema: UnsubscribeInputSchema,
  outputSchema: UnsubscribeOutputSchema,
  execute: async ({ context }) => {
    const res = await unsubscribeFromSender(context.messageId);
    return res;
  },
});

export const updateDraftTool = createTool({
  id: "enhanceDraftEmail",
  description:
    "Improve the subject and content of an existing Gmail draft using AI. Use this when the user says 'rewrite my draft', 'make it sound more professional', or 'refine this email'. Takes draft ID and current text, returns an updated, polished version.",
  inputSchema: UpdateDraftInputSchema,
  outputSchema: UpdateDraftOutputSchema,
  execute: async ({ context }) => {
    console.log("Executing: update draft");
    const draft = await updateDraftEmail(context.prompt, context.id);
    return {
      id: draft.id,
      subject: draft.subject,
      to: draft.to,
      userId: "me",
      snippet: draft.snippet ?? "",
    };
  },
});



// export const updateAndSendDraftTool = createTool({
//   id: "updateAndSendDrafts",
//   description: 'update the drafted mails by improving the quality of content and then send the email',
//   inputSchema: UpdateDraftInputSchema,
//   outputSchema: UpdateAndSendDraftOutputSchema,
//   execute: async ({ context }) => {
//     console.log("entered inside the update and send draft tool");
//     try {
//       // 1. Update the draft with improved content
//       const draft = await updateDraftEmail(context);
//       console.log("draft i get back", draft);
//       // 2. Send the updated draft
//       try {
//         await sendMessage({
//           userId: context.userId || "me",
//           to: draft.to,
//           subject: draft.subject,
//           snippet: draft.snippet,
//         });
//         return {
//           id: draft.id,
//           subject: draft.subject,
//           to: draft.to,
//           userId: context.userId || "me",
//           snippet: draft.snippet ?? "",
//           status: "send-successfully" as "send-successfully",
//         };
//       } catch (sendErr) {
//         console.error("Failed to send email after update", sendErr);
//         return {
//           id: draft.id,
//           subject: draft.subject,
//           to: draft.to,
//           userId: context.userId || "me",
//           snippet: draft.snippet ?? "",
//           status: "updated but not send " as "updated but not send ",
//         };
//       }
//     } catch (err) {
//       console.error("Failed to update and send draft", err);
//       return {
//         id: context.id,
//         subject: context.subject,
//         to: context.to,
//         userId: context.userId || "me",
//         snippet: context.snippet ?? "",
//         status: "not able to send" as "not able to send",
//       };
//     }
//   }
// });


// export const deleteDraftTool = createTool({
//   id: 'deleteDrafts',
//   description: 'delete the drafted mails',
//   inputSchema: DeleteDraftInputSchema,
//   outputSchema: DeleteDraftOutputSchema,
//   execute: async ({ context }) => {
//     console.log("entered inside the delete draft tool");
//     const result = await deleteDraftEmail(context);
//     console.log("delete result", result);
//     return result;
//   },
// });
