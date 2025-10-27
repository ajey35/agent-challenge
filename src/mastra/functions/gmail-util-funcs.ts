import { google } from "googleapis";
import { getOAuth2Client } from "../utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { type UnsubscribeOutputSchema } from "../types/types";
import {
  DraftEmail,
  CreateDraftInput,
  SendMessageInput,
  CreateDraftOutput,
  SendMessageOutput,
  CreateDraftInputSchema,
  SendMessageInputSchema,
 UpdateDraftOutputSchema
} from "../types/gmail";
import {
  GmailDraft,
  DraftBody,
  MessageBody
} from "../types/gmail-api";
import dotenv from "dotenv";
dotenv.config();

// 🎯 Schemas
export const FetchPrioritizedEmailsInputSchema = z.object({
  maxResults: z.number().default(10).describe("Number of unread emails to fetch and prioritize"),
});

export const FetchPrioritizedEmailsOutputSchema = z.object({
  emails: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      from: z.string(),
      snippet: z.string(),
      priority: z.number(),
      reasoning: z.string().optional(),
      received: z.string(),
    })
  ),
});

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  received: string;
}

interface PrioritizedEmail extends Email {
  priority: number;
  reasoning?: string;
}

// ⚡ Heuristic keywords (used as fallback or weight booster)
const HIGH_PRIORITY_KEYWORDS = [
  "urgent",
  "asap",
  "important",
  "deadline",
  "critical",
  "emergency",
  "review",
  "approval",
  "required",
  "action",
].map((k) => k.toLowerCase());

// Basic fallback heuristic
function heuristicPriority(email: Email): number {
  let score = 0;
  const text = (email.subject + " " + email.snippet).toLowerCase();
  HIGH_PRIORITY_KEYWORDS.forEach((kw) => {
    if (text.includes(kw)) score += 2;
  });

  // Recency boost
  const receivedDate = new Date(email.received);
  const hoursAgo = (Date.now() - receivedDate.getTime()) / 36e5;
  if (hoursAgo < 24) score += 3;
  else if (hoursAgo < 48) score += 2;
  else if (hoursAgo < 72) score += 1;

  return score;
}


// Initialize Gemini model
console.log("geminiapikey->",process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// 🧠 LLM-powered scoring using Gemini
async function getLLMPriority(email: Email): Promise<{ score: number; reasoning: string }> {
  try {
    const prompt = `
You are an intelligent email prioritization assistant.
Rate the following email from 1 to 10 based on urgency and importance.
Consider tone, sender, and time sensitivity.

Return ONLY a valid JSON object in the following format:
{"score": number, "reasoning": "string"}

Email details:
From: ${email.from}
Subject: ${email.subject}
Snippet: ${email.snippet}
Received: ${email.received}
`;

    // Call Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log("Gemini raw response:", content);

    // Clean up Markdown/code block formatting if any
    const cleanContent = content.replace(/```json|```/g, '').trim();

    // Try parsing JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
      if (typeof parsed.score !== "number" || typeof parsed.reasoning !== "string") {
        throw new Error("Invalid Gemini response structure");
      }
    } catch (err) {
      console.error("Gemini JSON parse error:", err);
      const fallbackScore = heuristicPriority(email);
      return {
        score: fallbackScore,
        reasoning: "Failed to parse Gemini response, using heuristic score only"
      };
    }

    // ✅ Valid structured response
    return {
      score: Math.min(Math.max(parsed.score, 0), 10),
      reasoning: parsed.reasoning
    };

  } catch (err) {
    console.error("Gemini LLM priority error:", err);
    const fallbackScore = heuristicPriority(email);
    return {
      score: fallbackScore,
      reasoning: "Gemini evaluation failed, using heuristic score only"
    };
  }
}

// 📬 Fetch + prioritize emails
export async function getPrioritizedEmails(maxResults = 10): Promise<PrioritizedEmail[]> {
  // Reuse getUnreadEmails to fetch the base email data
  const baseEmails = await getUnreadEmails(maxResults, "is:unread");
  const prioritized: PrioritizedEmail[] = [];

  for (const email of baseEmails) {
    // Add received time from message headers
    const enrichedEmail: Email = {
      ...email,
      received: new Date().toISOString(), // You might want to fetch this from the message headers if needed
    };

    // 🧩 Combine heuristic + LLM scoring
    const heuristic = heuristicPriority(enrichedEmail);
    const ai = await getLLMPriority(enrichedEmail);

    const finalScore = 0.6 * ai.score + 0.4 * heuristic;
    prioritized.push({ ...enrichedEmail, priority: finalScore, reasoning: ai.reasoning });
  }

  return prioritized.sort((a, b) => b.priority - a.priority);
}


export async function getUnreadEmails(maxResults = 10, query = "is:unread") {
  const oAuth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const messages = res.data.messages || [];
  const emails = [];

  for (const message of messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: message.id!,
    });

    const headers = full.data.payload?.headers || [];
    const subject = headers.find(h => h.name === "Subject")?.value || "No subject";
    const from = headers.find(h => h.name === "From")?.value || "Unknown";
    const received = headers.find(h => h.name === "Date")?.value || new Date().toISOString();
    const snippet = full.data.snippet || "";

    emails.push({ 
      id: message.id!, 
      subject, 
      from, 
      snippet,
      received 
    });
  }

  return emails;
}


export type UnsubscribeOutput = z.infer<typeof UnsubscribeOutputSchema>;

/**
 * Gets a list of draft emails for the authenticated user
 * @param maxResults Maximum number of drafts to return (default: 10)
 * @returns Array of draft emails with their metadata
 */
export async function getDraftEmails(maxResults = 10): Promise<DraftEmail[]> {
  try {
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // List drafts
    const res = await gmail.users.drafts.list({ 
      userId: "me",
      maxResults 
    });

    const messages = res.data.drafts || [];
    const draftemails: DraftEmail[] = [];

    for (const draft of messages) {
      try {
        const fullRes = await gmail.users.drafts.get({
          userId: "me",
          id: draft.id!,
        });
        console.log("fullRes",fullRes)

        const draftData = fullRes.data as GmailDraft;
        const message = draftData.message;

        const headers = message.payload?.headers || [];
        const subject = headers.find(h => h.name === "Subject")?.value || "No subject";
        const from = headers.find(h => h.name === "From")?.value || "Unknown";
        const to = headers.find(h => h.name === "To")?.value || "No recipient";
        const snippet = message.snippet || "";

        draftemails.push({ id: draft.id!, subject, from, to, snippet });
      } catch (err) {
        console.error(`Error fetching draft ${draft.id}:`, err);
        // Continue with next draft
      }
    }

    return draftemails;
  } catch (err) {
    console.error("Error fetching drafts:", err);
    throw new Error("Failed to fetch draft emails");
  }
}

/**
 * Creates a new draft email
 * @param options Draft creation options including recipient, subject, and body
 * @returns Created draft information
 */
// export async function createDraft(options: CreateDraftInput): Promise<CreateDraftOutput> {
//   try {
//     // Validate input
//     const validatedOptions = CreateDraftInputSchema.parse(options);
//     const { userId = "me", raw, to, subject, body } = validatedOptions;

//     const oAuth2Client = getOAuth2Client();
//     const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

//     const draftBody: DraftBody = { message: {} };

//     if (raw) {
//       draftBody.message.raw = raw;
//     } else if (to && subject && typeof body === "string") {
//       const rfc2822 = [
//         `To: ${to}`,
//         `Subject: ${subject}`,
//         "Content-Type: text/plain; charset=UTF-8",
//         "",
//         body,
//       ].join("\r\n");

//       const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
//       const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
//       draftBody.message.raw = base64url;
//     }

//     const res = await gmail.users.drafts.create({ 
//       userId, 
//       requestBody: draftBody 
//     });
    
//     if (!res.data.id || !res.data.message?.id) {
//       throw new Error('Invalid response from Gmail API: missing required fields');
//     }
    
//     return {
//       id: res.data.id,
//       message: {
//         id: res.data.message.id,
//         threadId: res.data.message.threadId || undefined
//       }
//     };
//   } catch (err) {
//     console.error("Error creating draft:", err);
//     throw new Error("Failed to create draft email");
//   }
// }

/**
 * Sends an email message
 * @param options Message options including recipient, subject, and body
 * @returns Sent message information
 */

export async function sendMessage(options: { userId?: string; to: string; subject: string; snippet: string; }): Promise<SendMessageOutput> {
  try {
    const { userId = "me", to, subject, snippet } = options;
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const rfc2822 = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      snippet,
    ].join("\r\n");
    const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
    const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const messageBody: MessageBody = { raw: base64url };
    const res = await gmail.users.messages.send({
      userId,
      requestBody: messageBody
    });
    if (!res.data.id) {
      throw new Error('Invalid response from Gmail API: missing message ID');
    }
    return {
      id: res.data.id,
      threadId: res.data.threadId || undefined,
      labelIds: res.data.labelIds || undefined
    };
  } catch (err) {
    console.error("Error sending message:", err);
    throw new Error("Failed to send email message");
  }
}

/**
 * Updates a draft email: fetches current content, sends to Gemini LLM for cleaning, then updates the draft with the cleaned content.
 * @param options Update options including userId, id, to, subject, and body
 * @returns The updated draft email
 */

export async function updateDraftEmail(options: {
  userId: string;
  id: string;
  to: string;
  subject: string;
  snippet: string;
}): Promise<z.infer<typeof UpdateDraftOutputSchema>> {
  const { userId, id, to, subject, snippet } = options;
  const oAuth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // 1️⃣ Fetch current draft content
  const fullRes = await gmail.users.drafts.get({ userId, id });
  const draftData = fullRes.data as GmailDraft;
  const currentSnippet = draftData.message?.snippet || "";

  // 2️⃣ Enhanced prompt for Gemini
  const prompt = `
You are a professional email writing assistant. 
Your goal is to rewrite the following email draft to make it sound:
- Polished and professional
- Concise but friendly
- Grammatically correct
- Natural for human conversation
Keep the same intent, tone, and important details.
Return only the improved email body, without any code blocks or commentary.

Here is the draft to improve:
---
${snippet || currentSnippet}
---
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const cleanedContent = response.text().replace(/```[a-z]*|```/g, "").trim();

  console.log("Cleaned email body:", cleanedContent);

  // 3️⃣ Create new RFC2822 message
  const rfc2822 = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    cleanedContent,
  ].join("\r\n");

  const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
  const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // 4️⃣ Instead of updating the same draft, create a *new draft*
  // (this ensures a new ID is generated and avoids Gmail caching old drafts)
  const newDraftRes = await gmail.users.drafts.create({
    userId,
    requestBody: {
      message: {
        raw: base64url,
      },
    },
  });

  // 5️⃣ Delete the old draft (optional, if you want to keep things clean)
  try {
    await gmail.users.drafts.delete({ userId, id });
  } catch (err) {
    console.warn("Failed to delete old draft (possibly already gone):", err);
  }

  // 6️⃣ Fetch full details of the new draft
  const newDraft = newDraftRes.data as GmailDraft;
  const message = newDraft.message;
  const headers = message?.payload?.headers || [];
  const subjectHeader = headers.find(h => h.name === "Subject")?.value || subject;
  const fromHeader = headers.find(h => h.name === "From")?.value || "me" ||"Unknown";
  const toHeader = headers.find(h => h.name === "To")?.value || to;
  const Newsnippet = message?.snippet || cleanedContent;

  return {
    userId,
    id: newDraft.id!,
    subject: subjectHeader,
    to: toHeader,
    snippet:Newsnippet,
  };
}

export async function deleteDraftEmail(options: { userId?: string; id: string }): Promise<{ success: boolean; id: string; message?: string }> {
  const { userId = "me", id } = options;
  const oAuth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  try {
    await gmail.users.drafts.delete({ userId, id });
    return { success: true, id, message: "Draft deleted successfully." };
  } catch (err: any) {
    console.error("Failed to delete draft:", err);
    return { success: false, id, message: err?.message || "Failed to delete draft." };
  }
}

export async function unsubscribeFromSender(senderEmail: string): Promise<UnsubscribeOutput> {
  const oAuth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Find latest message
  let messageId: string | undefined | null;
  try {
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: `from:${senderEmail}`,
      maxResults: 1
    });
    messageId = listRes.data.messages?.[0]?.id;
    if (!messageId) return { success: false, method: "no-messages" };
  } catch (err) {
    console.error("Error listing messages:", err);
    return { success: false, method: "list-error" };
  }

  // Fetch full message
  let full;
  try {
    full = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  } catch (err) {
    console.error("Error fetching message:", err);
    return { success: false, method: "fetch-error" };
  }

  const headers = full?.data.payload?.headers || [];
  const listUnsub = headers.find(h => (h.name || '').toLowerCase() === "list-unsubscribe")?.value;

  async function labelMessageUnsub() {
    const labelsRes = await gmail.users.labels.list({ userId: "me" });
    const labels = labelsRes.data.labels || [];
    let unsubLabel = labels.find(l => l.name === "UNSUBSCRIBED");
    if (!unsubLabel) {
      const created = await gmail.users.labels.create({
        userId: "me",
        requestBody: { name: "UNSUBSCRIBED", labelListVisibility: "labelShow", messageListVisibility: "show" }
      });
      unsubLabel = created.data;
    }
    if (unsubLabel?.id) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId!,
        requestBody: { addLabelIds: [unsubLabel.id] }
      });
    }
  }

  // Process List-Unsubscribe header
  if (listUnsub) {
    const parts = listUnsub.split(/,\s*/).map(p => p.replace(/[<>]/g, '').trim());
    for (const part of parts) {
      try {
        if (part.startsWith("mailto:")) {
          const to = part.replace(/^mailto:/i, '');
          const raw = Buffer.from(
            `From: me\r\nTo: ${to}\r\nSubject: Unsubscribe\r\n\r\nPlease unsubscribe me from this mailing list.`
          ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, '');
          await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
          await labelMessageUnsub();
          return { success: true, method: "mailto", address: to };
        } else if (/^https?:\/\//i.test(part)) {
          await fetch(part, { method: "GET" });
          await labelMessageUnsub();
          return { success: true, method: "url", url: part };
        }
      } catch (err) {
        console.warn("Failed to process list-unsubscribe part", part, err);
      }
    }
  }

  // Fallback - search snippet for a URL
  const snippet = full?.data.snippet || "";
  const urlMatch = snippet.match(/https?:\/\/[\w\-./?=&%]+/i);
  if (urlMatch) {
    const url = urlMatch[0];
    try {
      await fetch(url, { method: "GET" });
      await labelMessageUnsub();
      return { success: true, method: "url-snippet", url };
    } catch (err) {
      console.warn("Failed to hit unsubscribe URL from snippet", err);
    }
  }

  // Final fallback - label only
  await labelMessageUnsub();
  return { success: false, method: "label-only" };
}
