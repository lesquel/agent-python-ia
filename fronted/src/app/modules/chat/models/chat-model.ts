// Tipos base para los eventos del agente
export type EventType = 'RunResponse' | 'UpdatingMemory' | 'RunCompleted';
export type ContentType = 'str' | 'json' | 'markdown';

// Interfaz base para todos los eventos
export interface BaseAgentEvent {
  content: string;
  content_type: ContentType;
  event: EventType;
  run_id: string;
  agent_id: string;
  session_id: string;
  created_at: number;
}

// Métricas para eventos completados
export interface EventMetrics {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  additional_metrics: {
    completion_time: number;
    prompt_time: number;
    queue_time: number;
    total_time: number;
  };
  time: number;
  time_to_first_token: number;
}

// Mensaje en el historial
// export interface ChatMessage {
//   content: string;
//   from_history: boolean;
//   stop_after_tool_call: boolean;
//   role: 'system' | 'user' | 'assistant';
//   created_at: number;
//   metrics?: EventMetrics;
// }

// Evento de respuesta en ejecución
export interface RunResponseEvent extends BaseAgentEvent {
  event: 'RunResponse';
}

// Evento de actualización de memoria
export interface UpdatingMemoryEvent extends BaseAgentEvent {
  event: 'UpdatingMemory';
}

// Evento de ejecución completada
export interface RunCompletedEvent extends BaseAgentEvent {
  event: 'RunCompleted';
  model: string;
  messages: ChatMessage[];
}

// Unión de todos los tipos de eventos
export type AgentEvent =
  | RunResponseEvent
  | UpdatingMemoryEvent
  | RunCompletedEvent;

// Respuesta completa del agente
export interface AgentResponse {
  events: AgentEvent[];
  session_id: string;
  run_id: string;
  agent_id: string;
}

// Estado del agente
export interface AgentState {
  isRunning: boolean;
  currentContent: string;
  memoryUpdated: boolean;
  completedRun?: RunCompletedEvent;
  error?: string;
}


export interface ChatMessage {
  id: string;
  content: string;
  displayedContent: string; // Contenido que se muestra gradualmente
  isComplete: boolean;
  isStreaming: boolean;
  event: string;
  timestamp: number;
  rawContent?: string; // Contenido completo sin procesar
}