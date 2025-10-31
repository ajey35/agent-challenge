import { google } from "googleapis";
import { getOAuth2Client } from "../utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { type UnsubscribeOutputSchema } from "../types/types";
import {
  DraftEmail,
  CreateDraftOutput,
  UpdateDraftOutputSchema,
} from "../types/gmail";
import { SendMessageOutput } from "../types/sent-mail";
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
export async function createDraft(prompt: string): Promise<CreateDraftOutput> {
  try {
    // Extract email components from the prompt using Gemini
    const emailPrompt = `You are a professional email writing assistant.
Based on the following prompt, extract and generate email components.
Return ONLY a valid JSON object in this format:
{
  "to": "email@address.com",
  "subject": "Clear subject line",
  "body": "Professional email body"
}

User's prompt:
${prompt}
`;

    const result = await model.generateContent(emailPrompt);
    const response = await result.response;
    const content = response.text().trim();

    // Parse Gemini response
    const emailComponents = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    if (!emailComponents.to || !emailComponents.subject || !emailComponents.body) {
      throw new Error('Invalid email components generated from prompt');
    }

    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Create RFC2822 formatted email
    const rfc2822 = [
      `To: ${emailComponents.to}`,
      `Subject: ${emailComponents.subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      emailComponents.body,
    ].join("\r\n");

    const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
    const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    
    const draftBody: DraftBody = {
      message: {
        raw: base64url
      }
    };

    // Create the draft
    const res = await gmail.users.drafts.create({
      userId: "me",
      requestBody: draftBody
    });
    
    if (!res.data.id || !res.data.message?.id) {
      throw new Error('Invalid response from Gmail API: missing required fields');
    }
    
    return {
      id: res.data.id,
      message: {
        id: res.data.message.id,
        threadId: res.data.message.threadId || undefined,
        mail: {
          id: res.data.message.id,
          subject: emailComponents.subject,
          from: "me",
          to: emailComponents.to,
          snippet: emailComponents.body
        }
      }
    };
  } catch (err) {
    console.error("Error creating draft:", err);
    throw new Error("Failed to create draft email");
  }
}

/**
 * Sends an email message
 * @param options Message options including recipient, subject, and body
 * @returns Sent message information
 */

export async function sendMessage(prompt: string): Promise<SendMessageOutput> {
  try {
    // Extract email components from the prompt using Gemini
    const emailPrompt = `You are a professional email writing assistant.
Based on the following prompt, extract and generate email components.
Return ONLY a valid JSON object in this format:
{
  "to": "email@address.com",
  "subject": "Clear subject line",
  "body": "Professional email body"
}

User's prompt:
${prompt}
`;

    const result = await model.generateContent(emailPrompt);
    const response = await result.response;
    const content = response.text().trim();

    // Parse Gemini response
    const emailComponents = JSON.parse(content.replace(/```json|```/g, '').trim());
    
    if (!emailComponents.to || !emailComponents.subject || !emailComponents.body) {
      throw new Error('Invalid email components generated from prompt');
    }

    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Create RFC2822 formatted email
    const rfc2822 = [
      `To: ${emailComponents.to}`,
      `Subject: ${emailComponents.subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      emailComponents.body,
    ].join("\r\n");

    const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
    const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const messageBody: MessageBody = { raw: base64url };

    // Send the email
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: messageBody
    });

    if (!res.data.id) {
      throw new Error('Invalid response from Gmail API: missing message ID');
    }

    // Fetch all sent emails
    const sentList = await gmail.users.messages.list({
      userId: "me",
      q: "in:sent",
      maxResults: 20 // Fetch last 20 sent emails
    });

    const messages = sentList.data.messages || [];
    const sentEmails = [];

    // Get details for each sent email
    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full"
      });

      const headers = fullMessage.data.payload?.headers || [];
      const sentEmail = {
        id: message.id!,
        threadId: fullMessage.data.threadId || undefined,
        labelIds: fullMessage.data.labelIds || undefined,
        status: message.id === res.data.id ? "just sent" : "sent",
        mail: {
          subject: headers.find(h => h.name === "Subject")?.value || "No subject",
          from: headers.find(h => h.name === "From")?.value || "me",
          to: headers.find(h => h.name === "To")?.value || "No recipient",
          snippet: fullMessage.data.snippet || "",
          timestamp: headers.find(h => h.name === "Date")?.value || new Date().toISOString()
        }
      };
      sentEmails.push(sentEmail);
    }

    // Return all sent emails, sorted by timestamp (newest first)
    return {
      status: "mail sent successfully",
      newMailId: res.data.id,
      sentEmails: sentEmails.sort((a, b) => 
        new Date(b.mail.timestamp).getTime() - new Date(a.mail.timestamp).getTime()
      )
    };
  } catch (err) {
    console.error("Error sending message:", err);
    throw new Error(err instanceof Error ? err.message : "Failed to send email message");
  }
}

/**
 * Updates a draft email: fetches current content, sends to Gemini LLM for cleaning, then updates the draft with the cleaned content.
 * @param options Update options including userId, id, to, subject, and body
 * @returns The updated draft email
 */

export async function updateDraftEmail(prompt: string, draftId: string): Promise<z.infer<typeof UpdateDraftOutputSchema>> {
  try {
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // 1️⃣ Fetch current draft content
    const fullRes = await gmail.users.drafts.get({ userId: "me", id: draftId });
    const draftData = fullRes.data as GmailDraft;

    // Extract headers and body robustly
    const draftHeaders = draftData.message?.payload?.headers || [];
    const currentTo = draftHeaders.find(h => h.name === "To")?.value || "";
    const currentSubject = draftHeaders.find(h => h.name === "Subject")?.value || "";

    // Try to decode the actual saved body if available, fall back to snippet
    let currentBody = draftData.message?.snippet || "";
    const payload = draftData.message?.payload;
    try {
      if (payload?.body?.data) {
        const decoded = Buffer.from(payload.body.data, 'base64').toString('utf8');
        if (decoded.trim()) currentBody = decoded;
      } else if (payload?.parts && Array.isArray(payload.parts)) {
        const plain = payload.parts.find(p => p.mimeType === 'text/plain' && p.body?.data);
        if (plain?.body?.data) {
          const decoded = Buffer.from(plain.body.data, 'base64').toString('utf8');
          if (decoded.trim()) currentBody = decoded;
        }
      }
    } catch (err) {
      // decoding failed - keep snippet
    }

    // 2️⃣ Build enhancement prompt for Gemini
    const enhancementPrompt = `You are a professional email writing assistant with expertise in business communication.\n` +
      `Your task is to enhance the following email while keeping its intent intact.\n\n` +
      `Current Email:\nTo: ${currentTo}\nSubject: ${currentSubject}\nContent:\n${currentBody}\n\n` +
      `User's enhancement instructions: ${prompt}\n\n` +
      `Return ONLY a JSON object with this shape: {"subject": "Enhanced subject line", "body": "Enhanced email body"}`;

    // 3️⃣ Call Gemini to get enhanced content
    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    const rawText = response.text().trim();

    // Try to parse structured JSON from the model; fallback to using full text as body
    let enhancedSubject = currentSubject;
    let enhancedBody = currentBody;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.subject) enhancedSubject = String(parsed.subject);
      if (parsed.body) enhancedBody = String(parsed.body);
    } catch (err) {
      // If parsing fails, treat the whole model output as the new body and keep subject
      enhancedBody = rawText;
    }

    // 4️⃣ Create RFC2822 message with enhanced content
    const rfc2822 = [
      `To: ${currentTo}`,
      `Subject: ${enhancedSubject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      enhancedBody,
    ].join("\r\n");

    const encoded = Buffer.from(rfc2822, "utf8").toString("base64");
    const base64url = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    // 5️⃣ Create a new draft with the enhanced content
    const newDraftRes = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw: base64url } },
    });

    // 6️⃣ Delete the old draft (best-effort)
    try {
      await gmail.users.drafts.delete({ userId: "me", id: draftId });
    } catch (err) {
      console.warn('Failed to delete old draft:', err);
    }

    // 7️⃣ Return the updated draft info matching UpdateDraftOutputSchema
    const newDraft = newDraftRes.data as GmailDraft;
    const newId = newDraft.id || '';

    return {
      userId: 'me',
      id: newId,
      to: currentTo,
      subject: enhancedSubject,
      snippet: enhancedBody.substring(0, 200),
    };
  } catch (err) {
    console.error('Error updating draft:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update draft');
  }
}

// export async function deleteDraftEmail(options: { userId?: string; id: string }): Promise<{ success: boolean; id: string; message?: string }> {
//   const { userId = "me", id } = options;
//   const oAuth2Client = getOAuth2Client();
//   const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
//   try {
//     await gmail.users.drafts.delete({ userId, id });
//     return { success: true, id, message: "Draft deleted successfully." };
//   } catch (err: any) {
//     console.error("Failed to delete draft:", err);
//     return { success: false, id, message: err?.message || "Failed to delete draft." };
//   }
// }

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
