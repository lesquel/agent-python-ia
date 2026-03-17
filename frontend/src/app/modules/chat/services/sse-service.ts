import { Injectable } from "@angular/core"
import { Observable } from "rxjs"
import { environment } from '@environments/environment.development';
import { env } from "process";


export interface SSEMessage {
  content: string
  content_type: string
  event: string
  run_id: string
  agent_id: string
  session_id: string
  created_at: number
  model?: string
  messages?: any[]
  metrics?: any
  failed_generation?: any
}

export interface StreamResponse {
  fullContent: string
  currentChunk: string
  event: string
  isComplete: boolean
  isError: boolean
  rawMessage: SSEMessage
}

@Injectable({
  providedIn: "root",
})
export class SseService {
  private readonly apiUrl = environment.agentsDirectUrl;

  streamFromAgent(agentId: string, message: string): Observable<StreamResponse> {
    const url = `${this.apiUrl}/${agentId}/runs`

    const formData = new FormData()
    formData.append("message", message)
    formData.append("stream", "true")
    formData.append("monitor", "false")
    formData.append("session_id", "default_session")
    formData.append("user_id", "default_user")

    return new Observable<StreamResponse>((observer) => {
      const controller = new AbortController()
      let fullContent = ""
      let buffer = ""

      fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: formData,
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            const errorText = await response.text()
            throw new Error(`Error SSE: ${response.status} ${response.statusText} - ${errorText}`)
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder("utf-8")
          console.log("📦 Iniciando lectura SSE...")

          while (true) {
            const { value, done } = await reader.read()
            if (done) {
              console.log("📦 Lectura SSE completada")
              break
            }

            const decodedChunk = decoder.decode(value, { stream: true })
            buffer += decodedChunk

            // Extraer objetos JSON completos del buffer (VERSIÓN CORREGIDA)
            const { jsonObjects, remainingBuffer } = this.extractCompleteJsonObjects(buffer)
            buffer = remainingBuffer

            console.log(`📦 Objetos JSON extraídos: ${jsonObjects.length}`)

            for (const jsonStr of jsonObjects) {
              try {
                const sseMessage: SSEMessage = JSON.parse(jsonStr)
                console.log("📨 Evento SSE:", sseMessage.event, "Contenido:", sseMessage.content)

                // Actualizar fullContent ANTES de procesar el mensaje
                if (sseMessage.event === "RunResponse" && sseMessage.content) {
                  fullContent += sseMessage.content
                  console.log("📝 Contenido acumulado:", fullContent)
                }

                this.processSSEMessage(sseMessage, fullContent, observer)

                // Terminar si es un evento de finalización
                if (sseMessage.event === "RunCompleted" || sseMessage.event === "RunError") {
                  console.log("🏁 Finalizando stream por evento:", sseMessage.event)
                  return
                }
              } catch (parseError) {
                console.warn("Error parsing JSON object:", parseError, "JSON:", jsonStr)
              }
            }
          }

          observer.complete()
        })
        .catch((err) => {
          console.error("SSE Error:", err)
          observer.error(err)
        })

      return () => {
        controller.abort()
      }
    })
  }

  // MÉTODO CORREGIDO para extraer objetos JSON completosw
  private extractCompleteJsonObjects(buffer: string): { jsonObjects: string[]; remainingBuffer: string } {
    const jsonObjects: string[] = []
    let braceCount = 0
    let startIndex = 0
    let inString = false
    let escapeNext = false
    let currentIndex = 0

    while (currentIndex < buffer.length) {
      const char = buffer[currentIndex]

      if (escapeNext) {
        escapeNext = false
        currentIndex++
        continue
      }

      if (char === "\\") {
        escapeNext = true
        currentIndex++
        continue
      }

      if (char === '"' && !escapeNext) {
        inString = !inString
        currentIndex++
        continue
      }

      if (!inString) {
        if (char === "{") {
          if (braceCount === 0) {
            startIndex = currentIndex
          }
          braceCount++
        } else if (char === "}") {
          braceCount--
          if (braceCount === 0) {
            // Objeto JSON completo encontrado
            const jsonStr = buffer.substring(startIndex, currentIndex + 1)
            if (jsonStr.trim()) {
              jsonObjects.push(jsonStr)
              console.log("✅ JSON completo extraído:", jsonStr.substring(0, 100) + "...")
            }
          }
        }
      }

      currentIndex++
    }

    // Si hay un objeto JSON incompleto, mantenerlo en el buffer
    let remainingBuffer = ""
    if (braceCount > 0) {
      remainingBuffer = buffer.substring(startIndex)
      console.log("📦 JSON incompleto en buffer:", remainingBuffer.substring(0, 100) + "...")
    }

    return { jsonObjects, remainingBuffer }
  }

  private processSSEMessage(sseMessage: SSEMessage, fullContent: string, observer: any): void {
    if (sseMessage.event === "RunResponse" && sseMessage.content) {
      const streamResponse: StreamResponse = {
        fullContent: fullContent,
        currentChunk: sseMessage.content,
        event: sseMessage.event,
        isComplete: false,
        isError: false,
        rawMessage: sseMessage,
      }
      console.log("➡️ Enviando respuesta al componente:", streamResponse)
      observer.next(streamResponse)
    }

    if (sseMessage.event === "RunCompleted") {
      const completedResponse: StreamResponse = {
        fullContent: sseMessage.content || fullContent,
        currentChunk: "",
        event: sseMessage.event,
        isComplete: true,
        isError: false,
        rawMessage: sseMessage,
      }
      console.log("✅ Enviando respuesta completada:", completedResponse)
      observer.next(completedResponse)
      observer.complete()
    }

    if (sseMessage.event === "RunError") {
      const errorResponse: StreamResponse = {
        fullContent: sseMessage.content || fullContent,
        currentChunk: sseMessage.content,
        event: sseMessage.event,
        isComplete: true,
        isError: true,
        rawMessage: sseMessage,
      }
      console.log("❌ Enviando respuesta de error:", errorResponse)
      observer.next(errorResponse)
      observer.complete()
    }

    if (sseMessage.event === "UpdatingMemory") {
      const memoryResponse: StreamResponse = {
        fullContent,
        currentChunk: sseMessage.content,
        event: sseMessage.event,
        isComplete: false,
        isError: false,
        rawMessage: sseMessage,
      }
      observer.next(memoryResponse)
    }

    if (sseMessage.event === "RunStarted") {
      const startedResponse: StreamResponse = {
        fullContent,
        currentChunk: sseMessage.content,
        event: sseMessage.event,
        isComplete: false,
        isError: false,
        rawMessage: sseMessage,
      }
      observer.next(startedResponse)
    }

    if (sseMessage.event === "ToolCallStarted") {
      const toolResponse: StreamResponse = {
        fullContent,
        currentChunk: sseMessage.content,
        event: sseMessage.event,
        isComplete: false,
        isError: false,
        rawMessage: sseMessage,
      }
      observer.next(toolResponse)
    }
  }
}
