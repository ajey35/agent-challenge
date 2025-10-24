// import { google } from "googleapis";
// import { getOAuth2Client } from "../utils/gmail_utils";

// export async function getDraftEmails(maxResults = 10, query = "is:unread") {
//   const oAuth2Client = getOAuth2Client();

  
//   const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  

//   // List drafts for the authenticated user. Provide userId and maxResults.
//   const res = await gmail.users.drafts.list({ userId: "me", maxResults });

//   const messages = res.data.drafts || [];
//   const emails: { id: string; subject: string; from: string; snippet: string }[] = [];

//   for (const draft of messages) {
//     // Get the full draft resource. The draft contains a `message` object which
//     // holds the payload and headers.
//     const fullRes = await gmail.users.drafts.get({
//       userId: "me",
//       id: draft.id!,
//     });

//     const draftData = fullRes.data;
//     // Drafts have a `message` property; fall back to draftData itself if absent.
//     const message = (draftData as any).message || (draftData as any);

//     const headers = message?.payload?.headers || [];
//     const subject = headers.find((h: any) => h.name === "Subject")?.value || "No subject";
//     const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
//     const snippet = message?.snippet || (draftData as any).snippet || "";

//     emails.push({ id: draft.id!, subject, from, snippet });
//   }

//   return emails;
// }
