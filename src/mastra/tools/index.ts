import { createTool } from '@mastra/core/tools';
import { z } from 'zod';


// import { WeatherToolResultSchema } from '../types/types';
// import { 
//   FetchEmailsInputSchema,
//   FetchEmailsOutputSchema,
//   FetchPrioritizedEmailsInputSchema,
//   FetchPrioritizedEmailsOutputSchema
// } from '../types/types';
import {
  CreateDraftInputSchema,
  // CreateDraftInputSchema,
  // SendMessageInputSchema,
  
  // CreateDraftOutputSchema,
  // SendMessageOutputSchema,
  DraftListOutputSchema,
  UpdateAndSendDraftOutputSchema,
  UpdateDraftInputSchema,
  UpdateDraftOutputSchema,
  DeleteDraftInputSchema,
  DeleteDraftOutputSchema
} from '../types/gmail';
import { 
  // getUnreadEmails, 
  // getPrioritizedEmails,
  getDraftEmails,
  updateDraftEmail,
  sendMessage,
  deleteDraftEmail
  // createDraft,
  // sendMessage
} from '../functions/gmail-util-funcs';
// import { unsubscribeFromSender } from '../functions/personal_agent_funcs';
// import { UnsubscribeInputSchema, UnsubscribeOutputSchema } from '../types/types';

export const getDraftsTool = createTool({
  id: 'getDrafts',
  description: 'get all drafted emails',
  outputSchema: DraftListOutputSchema,
  execute: async () => {
    console.log("entered inside the get draft tool")
    const drafts = await getDraftEmails(15);
    return drafts;
  },
});

export const updateDraftTool = createTool({
  id: 'updateDrafts',
  description: 'update the drafted mails by improving the quality of content',
  inputSchema:UpdateDraftInputSchema,
  outputSchema: UpdateDraftOutputSchema,
  execute: async ({context}) => {
    console.log("entered inside the update draft tool")
    const draft = await updateDraftEmail(context);
    console.log("draft i get back",draft)
    // Ensure the returned object matches the output schema
    return {
      id: draft.id,
      subject: draft.subject,
      to: draft.to,
      userId: "me",
      snippet: draft.snippet ?? "",
    };
  },
});

export const updateAndSendDraftTool = createTool({
  id: "updateAndSendDrafts",
  description: 'update the drafted mails by improving the quality of content and then send the email',
  inputSchema: UpdateDraftInputSchema,
  outputSchema: UpdateAndSendDraftOutputSchema,
  execute: async ({ context }) => {
    console.log("entered inside the update and send draft tool");
    try {
      // 1. Update the draft with improved content
      const draft = await updateDraftEmail(context);
      console.log("draft i get back", draft);
      // 2. Send the updated draft
      try {
        await sendMessage({
          userId: context.userId || "me",
          to: draft.to,
          subject: draft.subject,
          snippet: draft.snippet,
        });
        return {
          id: draft.id,
          subject: draft.subject,
          to: draft.to,
          userId: context.userId || "me",
          snippet: draft.snippet ?? "",
          status: "send-successfully" as "send-successfully",
        };
      } catch (sendErr) {
        console.error("Failed to send email after update", sendErr);
        return {
          id: draft.id,
          subject: draft.subject,
          to: draft.to,
          userId: context.userId || "me",
          snippet: draft.snippet ?? "",
          status: "updated but not send " as "updated but not send ",
        };
      }
    } catch (err) {
      console.error("Failed to update and send draft", err);
      return {
        id: context.id,
        subject: context.subject,
        to: context.to,
        userId: context.userId || "me",
        snippet: context.snippet ?? "",
        status: "not able to send" as "not able to send",
      };
    }
  }
});


export const deleteDraftTool = createTool({
  id: 'deleteDrafts',
  description: 'delete the drafted mails',
  inputSchema: DeleteDraftInputSchema,
  outputSchema: DeleteDraftOutputSchema,
  execute: async ({ context }) => {
    console.log("entered inside the delete draft tool");
    const result = await deleteDraftEmail(context);
    console.log("delete result", result);
    return result;
  },
});


// export const emailTool = createTool({
//   id: "fetchEmails",
//   description: "Retrieve unread Gmail messages. Use this when user asks to check, view, or get their unread emails. Supports custom search queries and limiting number of results.",
//   inputSchema: FetchEmailsInputSchema,
//   outputSchema: FetchEmailsOutputSchema,
//   execute: async ({ context }) => {
//     console.log("Executing email tool")
//     const emails = await getUnreadEmails(context.maxResults, context.query);
//     return { emails };
//   },
// });

// export const prioritizedEmailTool = createTool({
//   id: "fetchPrioritizedEmails",
//   description: "Get unread emails sorted by importance using AI and heuristics. Use this when user wants to see their most important or urgent emails first, or needs help managing email overload.",
//   inputSchema: FetchPrioritizedEmailsInputSchema,
//   outputSchema: FetchPrioritizedEmailsOutputSchema,
//   execute: async ({ context }) => {
//     console.log("Executing prioritized email tool");
//     const emails = await getPrioritizedEmails(context.maxResults);
//     return { emails };
//   },
// });

// export const unsubscribeTool = createTool({
//   id: 'unsubscribeEmail',
//   description: 'Unsubscribe from email newsletters or mailing lists. Use this when user wants to stop receiving emails from a specific sender. Handles both List-Unsubscribe headers and common unsubscribe patterns.',
//   inputSchema: UnsubscribeInputSchema,
//   outputSchema: UnsubscribeOutputSchema,
//   execute: async ({ context }) => {
//     const res = await unsubscribeFromSender(context.messageId);
//     return res;
//   },
// });
// export const createDraftTool = createTool({
//   id: 'createDraft',
//   description: 'Create a new Gmail draft message. Use this when user wants to compose or start a new email without sending it immediately. Supports both simple text messages and raw MIME messages.',
//   inputSchema: CreateDraftInputSchema,
//   outputSchema: CreateDraftOutputSchema,
//   execute: async ({ context }) => {
//     const draft = await createDraft(context);
//     return draft;
//   },
// });

// export const sendMessageTool = createTool({
//   id: 'sendMessage',
//   description: 'Send a new Gmail message immediately. Use this when user wants to send an email right away. Supports both simple text messages and raw MIME messages.',
//   inputSchema: SendMessageInputSchema,
//   outputSchema: SendMessageOutputSchema,
//   execute: async ({ context }) => {
//     const message = await sendMessage(context);
//     return message;
//   },
// });