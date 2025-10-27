"use client"

import { z } from "zod"
import { EmailSchema } from "./inbox-agent"

export const DraftsStateSchema = z.object({
  draftMails: z.array(EmailSchema).default([]),
})

export type DraftsState = z.infer<typeof DraftsStateSchema>

export const initialDraftsState: DraftsState = {
  draftMails: [
    {
      id: "draft-1",
      subject: "Project Update",
      from: "you@gmail.com",
      to: "team@company.com",
      snippet: "Here's the latest update on the project...",
    },
  ],
}