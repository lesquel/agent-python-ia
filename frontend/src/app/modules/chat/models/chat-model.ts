export type EventType =
  | "UserMessage"
  | "RunResponse"
  | "RunStarted"
  | "RunCompleted"
  | "RunError"
  | "UpdatingMemory"
  | "ToolCallStarted"
  | "Error"
  | "Cancelled"

export type ContentType = "text" | "str"

export interface BaseAgentEvent {
  content: string
  agent_id: string
  event: EventType
  run_id: string
  session_id: string
  created_at: number
  content_type: ContentType
}

export interface ChatMessage {
  id: string
  content: string
  displayedContent: string
  isComplete: boolean
  isStreaming: boolean
  event: EventType
  timestamp: number
}
