// Gmail API Types
export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailPayload {
  headers: GmailHeader[];
  mimeType: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailPayload[];
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: GmailPayload;
  raw?: string;
}

export interface GmailDraft {
  id: string;
  message: GmailMessage;
}

export interface DraftBody {
  message: {
    raw?: string;
  };
}

export interface MessageBody {
  raw?: string;
}