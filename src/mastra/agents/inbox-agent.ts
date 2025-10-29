"use client"

import { z } from "zod"

export const EmailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  snippet: z.string(),
})

export type Email = z.infer<typeof EmailSchema>

export const InboxStateSchema = z.object({
  emails: z.array(EmailSchema).default([]),
})

export type InboxState = z.infer<typeof InboxStateSchema>

export const initialInboxState: InboxState = {
  emails: [
    {
      id: "email-1",
      subject: "Meeting Tomorrow at 2 PM",
      from: "boss@company.com",
      to: "you@gmail.com",
      snippet: "Don't forget about our meeting tomorrow at 2 PM to discuss the Q4 roadmap and project timelines.",

    },
    {
      id: "email-2",
      subject: "Welcome to GmailAgent!",
      from: "support@gmailagent.com",
      to: "you@gmail.com",
      snippet: "Thanks for signing up! Here's how to get started with your new email management assistant.",
    },
  ],
}