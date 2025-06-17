import { Component, inject, ChangeDetectorRef } from "@angular/core"
import { SseService, type StreamResponse } from "./a_se"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container" style="color: #000;">
      <div class="messages">
        <div class="message user-message" *ngIf="userMessage">
          <strong>Usuario:</strong> {{ userMessage }}
        </div>
        <div class="message ai-message" *ngIf="aiResponse">
          <strong>IA:</strong> 
          <div [innerHTML]="aiResponse"></div>
        </div>
        <div class="message error-message" *ngIf="errorMessage">
          <strong>Error:</strong> {{ errorMessage }}
        </div>
        <div class="loading" *ngIf="isLoading">
          <span>{{ loadingMessage }}</span>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        
        <!-- Debug info -->
        <div class="debug-info" *ngIf="debugMode">
          <h4>Debug Info:</h4>
          <p>Loading: {{ isLoading }}</p>
          <p>Loading Message: {{ loadingMessage }}</p>
          <p>AI Response Length: {{ aiResponse.length }}</p>
          <p>Full Content: {{ fullContentDebug }}</p>
          <p>Last Event: {{ lastEvent }}</p>
          <p>Events Received: {{ eventsReceived.join(', ') }}</p>
        </div>
      </div>
      
      <div class="input-section">
        <input 
          [(ngModel)]="userMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Escribe tu mensaje..."
          [disabled]="isLoading"
        />
        <button (click)="sendMessage()" [disabled]="isLoading || !userMessage.trim()">
          {{ isLoading ? 'Enviando...' : 'Enviar' }}
        </button>
        <button (click)="clearChat()" [disabled]="isLoading">
          Limpiar
        </button>
        <button (click)="toggleDebug()">
          {{ debugMode ? 'Ocultar Debug' : 'Mostrar Debug' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
  .chat-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  
  .messages {
    min-height: 400px;
    max-height: 600px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    background: #f9f9f9;
  }
  
  .message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 6px;
    word-wrap: break-word;
  }
  
  .user-message {
    background: #e3f2fd;
    text-align: right;
  }
  
  .ai-message {
    background: #f1f8e9;
    white-space: pre-wrap;
  }
  
  .error-message {
    background: #ffebee;
    color: #c62828;
    border-left: 4px solid #f44336;
  }
  
  .debug-info {
    background: #fff3e0;
    border: 1px solid #ff9800;
    padding: 10px;
    border-radius: 4px;
    margin-top: 10px;
    font-size: 12px;
  }
  
  .loading {
    font-style: italic;
    color: #666;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .typing-indicator {
    display: flex;
    gap: 4px;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #666;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes typing {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
  
  .input-section {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  input {
    flex: 1;
    min-width: 200px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  button {
    padding: 10px 15px;
    background: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }
  
  button:hover:not(:disabled) {
    background: #1976d2;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`,
  ],
})
export class AComponent {
  userMessage = ""
  aiResponse = ""
  errorMessage = ""
  isLoading = false
  debugMode = false
  fullContentDebug = ""
  lastEvent = ""
  loadingMessage = "Escribiendo..."
  eventsReceived: string[] = []

  private sseService: SseService = inject(SseService)
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef)

  private readonly agentId = "09d92666-4776-431b-a3b1-8d9d648bb89b"

  sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return

    console.log("🚀 Enviando mensaje:", this.userMessage)

    // Guardar el mensaje del usuario para mostrarlo
    const currentUserMessage = this.userMessage

    this.isLoading = true
    this.aiResponse = ""
    this.errorMessage = ""
    this.fullContentDebug = ""
    this.lastEvent = ""
    this.loadingMessage = "Iniciando..."
    this.eventsReceived = []

    // Forzar detección de cambios
    this.cdr.detectChanges()

    this.sseService.streamFromAgent(this.agentId, currentUserMessage).subscribe({
      next: (response: StreamResponse) => {
        console.log("📨 Respuesta recibida en componente:", response)

        this.lastEvent = response.event
        this.eventsReceived.push(response.event)

        // Actualizar mensaje de loading según el evento
        if (response.event === "RunStarted") {
          this.loadingMessage = "Iniciando procesamiento..."
        } else if (response.event === "ToolCallStarted") {
          this.loadingMessage = "Ejecutando herramientas..."
        } else if (response.event === "RunResponse") {
          this.loadingMessage = "Escribiendo respuesta..."
          this.aiResponse = response.fullContent
          this.fullContentDebug = response.fullContent
          console.log("✅ Actualizando AI Response:", this.aiResponse)
        } else if (response.event === "UpdatingMemory") {
          this.loadingMessage = "Actualizando memoria..."
          console.log("🧠 Memoria actualizada:", response.currentChunk)
        }

        if (response.isComplete) {
          this.isLoading = false
          console.log("🏁 Stream completado")

          if (response.isError) {
            this.errorMessage = response.currentChunk || "Error desconocido"
            this.aiResponse = ""
          }
        }

        // Forzar detección de cambios después de cada actualización
        this.cdr.detectChanges()
      },
      error: (error) => {
        console.error("❌ Error:", error)
        this.isLoading = false
        this.errorMessage = "Error de conexión: " + error.message
        this.aiResponse = ""
        this.cdr.detectChanges()
      },
      complete: () => {
        console.log("🔚 Observable completado")
        this.isLoading = false
        this.cdr.detectChanges()
      },
    })
  }

  clearChat() {
    this.userMessage = ""
    this.aiResponse = ""
    this.errorMessage = ""
    this.fullContentDebug = ""
    this.lastEvent = ""
    this.eventsReceived = []
    this.cdr.detectChanges()
  }

  toggleDebug() {
    this.debugMode = !this.debugMode
    this.cdr.detectChanges()
  }
}
