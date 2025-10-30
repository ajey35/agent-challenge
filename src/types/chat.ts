export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
}

export interface AgentResponse {
  text: string | null
  object: any
  toolResults: Record<string, any> | null
}