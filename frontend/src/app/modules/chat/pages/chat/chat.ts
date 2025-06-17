import {
  Component,
  inject,
  ChangeDetectorRef,
  type ElementRef,
  ViewChild,
  type AfterViewChecked,
  type OnDestroy,
  input,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { type Subscription, interval, BehaviorSubject } from 'rxjs';
import type { ChatMessage, EventType } from './../../models/chat-model';
import { SseService, type StreamResponse } from './../../services/sse-service';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MarkdownModule],
  providers: [provideMarkdown()],
  template: `
    <div class="flex min-h-screen h-full relative bg-base-200">
      <!-- Sidebar placeholder - puedes agregar tu sidebar aquí -->
      <div class="w-64 bg-base-100 shadow-lg">
        <div class="p-4">
          <h2 class="text-lg font-bold">Chat Sidebar</h2>
        </div>
      </div>

      <div
        class="chat-container w-full p-4 md:p-8 flex flex-col gap-4 max-h-screen"
      >
        <!-- Header mejorado -->
        <div
          class="chat-header w-full flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-base-100 rounded-xl shadow-sm"
        >
          <div class="text-center md:text-left">
            <h3
              class="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            >
              🤖 Chat con Agente
            </h3>
            <p class="text-sm opacity-70 mt-1">ID: {{ agentId() }}</p>
          </div>

          <!-- Estado de conexión mejorado -->
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-full bg-base-200"
            >
              <div
                class="w-3 h-3 rounded-full transition-all duration-300"
                [class]="getConnectionStatusClass()"
              ></div>
              <span class="text-sm font-medium">{{
                getConnectionStatusText()
              }}</span>
            </div>

            <!-- Contador de mensajes -->
            @if (messages.length > 0) {
            <div class="badge badge-outline">
              {{ messages.length }} mensaje{{
                messages.length !== 1 ? 's' : ''
              }}
            </div>
            }
          </div>
        </div>

        <!-- Contenedor de chat -->
        <div class="flex-1 flex flex-col gap-4 min-h-0">
          <!-- Contenedor de mensajes con scroll -->
          <div
            #messagesContainer
            class="messages-container flex-1 overflow-y-auto p-4 space-y-4 bg-base-100 rounded-xl shadow-sm"
            style="max-height: calc(100vh - 250px);"
          >
            <!-- Estado vacío mejorado -->
            @if (messages.length === 0 && !isSending) {
            <div
              class="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
            >
              <div class="text-6xl mb-4">💬</div>
              <h4 class="text-xl font-semibold mb-2">
                ¡Comienza una conversación!
              </h4>
              <p class="text-base-content/70 max-w-md">
                Escribe tu mensaje abajo para comenzar a chatear con el agente
                de IA.
              </p>
            </div>
            }

            <!-- Mensajes -->
            @for (message of messages; track trackByMessageId($index, message))
            {

            <!-- Mensaje del Usuario -->
            @if (isUserMessage(message)) {
            <div class="chat chat-end">
              <div class="chat-header mb-1">
                <span class="text-xs opacity-60">{{
                  getEventLabel(message.event)
                }}</span>
                <time class="text-xs opacity-60 ml-2">{{
                  formatTimestamp(message.timestamp)
                }}</time>
              </div>
              <div
                class="chat-bubble chat-bubble-primary max-w-xs md:max-w-md lg:max-w-lg"
              >
                {{ message.displayedContent }}
              </div>
            </div>
            }

            <!-- Mensaje del Bot -->
            @if (isBotMessage(message)) {
            <div class="chat chat-start">
              <div class="chat-header mb-1">
                <span class="text-xs opacity-60">{{
                  getEventLabel(message.event)
                }}</span>
                <time class="text-xs opacity-60 ml-2">{{
                  formatTimestamp(message.timestamp)
                }}</time>
                @if (message.isStreaming) {
                <span class="loading loading-dots loading-xs ml-2"></span>
                }
              </div>
              <div
                class="chat-bubble bg-base-200 text-base-content max-w-xs md:max-w-md lg:max-w-2xl"
              >
                <div class="prose prose-sm max-w-none">
                  <markdown [data]="message.displayedContent"></markdown>
                </div>
                @if (message.isStreaming && message.displayedContent.length <
                message.content.length) {
                <span
                  class="inline-block w-2 h-4 bg-current animate-pulse ml-1"
                ></span>
                }
              </div>
            </div>
            }

            <!-- Mensaje del Sistema -->
            @if (isSystemMessage(message)) {
            <div class="flex justify-center my-2">
              <div
                class="flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-full text-sm"
              >
                <span class="opacity-70">{{
                  formatTimestamp(message.timestamp)
                }}</span>
                <span>{{ message.displayedContent }}</span>
              </div>
            </div>
            } }

            <!-- Indicador de carga -->
            @if (isSending && messages.length <= 1) {
            <div class="flex justify-center items-center py-8">
              <div class="flex flex-col items-center gap-4">
                <div class="loading loading-dots loading-lg text-primary"></div>
                <p class="text-base-content/70">
                  El agente está procesando tu mensaje...
                </p>
              </div>
            </div>
            }
          </div>

          <!-- Formulario mejorado -->
          <div class="bg-base-100 rounded-xl shadow-sm p-4">
            <form [formGroup]="msgForm" (submit)="sendMessage()" class="w-full">
              <div class="flex items-end gap-3">
                <!-- Input de mensaje -->
                <div class="flex-1">
                  <textarea
                    class="textarea textarea-bordered w-full resize-none min-h-[60px] max-h-[120px]"
                    placeholder="Escribe tu mensaje aquí... (Shift + Enter para nueva línea)"
                    rows="2"
                    formControlName="message"
                    (keydown)="handleKeyDown($event)"
                  ></textarea>

                  <!-- Mensajes de error -->
                  @if (msgForm.get('message')?.invalid &&
                  msgForm.get('message')?.touched) {
                  <div class="text-error text-sm mt-1">
                    Por favor, escribe un mensaje antes de enviar.
                  </div>
                  }
                </div>

                <!-- Botón de envío -->
                <div class="flex flex-col gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="isSending || !msgForm.valid"
                    [class.loading]="isSending"
                  >
                    @if (!isSending) {
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    }
                    {{ isSending ? 'Enviando...' : 'Enviar' }}
                  </button>

                  <!-- Botón de cancelar (solo visible cuando está enviando) -->
                  @if (isSending) {
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    (click)="cancelSending()"
                  >
                    Cancelar
                  </button>
                  }
                </div>
              </div>

              <!-- Información adicional -->
              <div
                class="flex justify-between items-center mt-2 text-xs opacity-60"
              >
                <span>Presiona Shift + Enter para nueva línea</span>
                <span
                  >{{ msgForm.get('message')?.value?.length || 0 }}/1000</span
                >
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .chat-container {
        height: 100vh;
      }

      .messages-container {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
      }

      .messages-container::-webkit-scrollbar {
        width: 6px;
      }

      .messages-container::-webkit-scrollbar-track {
        background: transparent;
      }

      .messages-container::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
    `,
  ],
})
export class Chat implements OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false })
  private messagesContainer!: ElementRef;

  // Configuración
  agentId = input<string>();
  private readonly typewriterSpeed = 25; // ms entre caracteres

  // Estado reactivo
  messages: ChatMessage[] = [];
  currentMessage: ChatMessage | null = null;
  isSending = false;
  connectionStatus$ = new BehaviorSubject<
    'idle' | 'connecting' | 'streaming' | 'error'
  >('idle');
  private shouldScrollToBottom = false;

  // Servicios
  private sseService = inject(SseService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // Subscripciones
  private subscription: Subscription | null = null;
  private typewriterSubscription: Subscription | null = null;

  // Formulario
  msgForm = this.fb.group({
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(1000),
      ],
    ],
  });

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage() {
    const messageContent = this.msgForm.get('message')?.value?.trim();
    if (!messageContent || this.isSending) return;

    this.startNewConversation(messageContent);
    this.msgForm.reset();
  }

  private startNewConversation(content: string) {
    console.log('🚀 Iniciando nueva conversación:', content);

    // Limpiar estado anterior
    this.cleanup();
    this.messages = [];
    this.currentMessage = null;
    this.isSending = true;
    this.connectionStatus$.next('connecting');

    // Agregar mensaje del usuario
    this.addUserMessage(content);

    // Iniciar stream con nuestro servicio SSE
    this.subscription = this.sseService
      .streamFromAgent(this.agentId() as string, content)
      .subscribe({
        next: (data: StreamResponse) => {
          console.log('📥 Datos recibidos en componente:', data);
          this.handleStreamData(data);
        },
        error: (error) => {
          console.error('❌ Error en componente:', error);
          this.handleError(error);
        },
        complete: () => {
          console.log('✅ Stream completado en componente');
          this.handleComplete();
        },
      });
  }

  private addUserMessage(content: string) {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      displayedContent: content,
      isComplete: true,
      isStreaming: false,
      event: 'UserMessage' as EventType,
      timestamp: Date.now(),
    };

    this.messages.push(userMessage);
    this.scheduleScrollToBottom();
    this.cdr.detectChanges();
    console.log('👤 Mensaje de usuario agregado:', userMessage);
  }

  private handleStreamData(data: StreamResponse) {
    console.log('📨 Procesando datos del stream:', data);
    this.connectionStatus$.next('streaming');

    switch (data.event) {
      case 'RunResponse':
        this.handleRunResponse(data);
        break;
      case 'RunStarted':
        this.handleRunStarted(data);
        break;
      case 'RunCompleted':
        this.handleRunCompleted(data);
        break;
      case 'UpdatingMemory':
        this.addSystemMessage(
          '🧠 Actualizando memoria del agente...',
          data.event as EventType
        );
        break;
      case 'ToolCallStarted':
        this.addSystemMessage(
          '🔧 Ejecutando herramientas...',
          data.event as EventType
        );
        break;
      default:
        console.log('ℹ️ Evento no manejado:', data.event, data);
        if (data.currentChunk) {
          this.handleRunResponse(data);
        }
    }
  }

  private handleRunStarted(data: StreamResponse) {
    console.log('🚀 Ejecución iniciada:', data);
    this.addSystemMessage(
      '🤖 El agente está procesando tu solicitud...',
      'RunStarted'
    );
  }

  private handleRunResponse(data: StreamResponse) {
    console.log('🤖 Respuesta del run:', data);

    // Crear nuevo mensaje si no existe o el actual está completo
    if (!this.currentMessage || this.currentMessage.isComplete) {
      this.currentMessage = {
        id: data.rawMessage.run_id || this.generateId(),
        content: '',
        displayedContent: '',
        isComplete: false,
        isStreaming: true,
        event: 'RunResponse' as EventType,
        timestamp: data.rawMessage.created_at || Date.now(),
      };
      this.messages.push(this.currentMessage);
      this.scheduleScrollToBottom();
      console.log('📝 Nuevo mensaje de bot creado:', this.currentMessage);
    }

    // Acumular contenido
    if (data.currentChunk) {
      this.currentMessage.content = data.fullContent;
      console.log('📝 Contenido acumulado:', this.currentMessage.content);

      // Iniciar efecto typewriter si no está activo
      if (!this.typewriterSubscription) {
        this.startTypewriterEffect();
      }
    }

    this.cdr.detectChanges();
  }

  private handleRunCompleted(data: StreamResponse) {
    console.log('✅ Ejecución completada:', data);
    this.stopTypewriter();

    // Finalizar mensaje actual
    if (this.currentMessage && this.currentMessage.isStreaming) {
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
      console.log('✅ Mensaje finalizado:', this.currentMessage);
    }

    this.scheduleScrollToBottom();
    this.cdr.detectChanges();
  }

  private startTypewriterEffect() {
    if (this.typewriterSubscription || !this.currentMessage) {
      return;
    }

    console.log('⌨️ Iniciando efecto typewriter');
    this.typewriterSubscription = interval(this.typewriterSpeed).subscribe(
      () => {
        if (!this.currentMessage) {
          this.stopTypewriter();
          return;
        }

        const fullContent = this.currentMessage.content;
        const displayedLength = this.currentMessage.displayedContent.length;

        if (displayedLength < fullContent.length) {
          // Agregar siguiente carácter
          this.currentMessage.displayedContent = fullContent.substring(
            0,
            displayedLength + 1
          );
          this.scheduleScrollToBottom();
          this.cdr.detectChanges();
        } else {
          // Contenido completamente mostrado
          if (
            this.currentMessage.isComplete ||
            !this.currentMessage.isStreaming
          ) {
            this.currentMessage.isStreaming = false;
            this.stopTypewriter();
          }
        }
      }
    );
  }

  private stopTypewriter() {
    if (this.typewriterSubscription) {
      console.log('⏹️ Deteniendo efecto typewriter');
      this.typewriterSubscription.unsubscribe();
      this.typewriterSubscription = null;
    }
  }

  private addSystemMessage(content: string, event: EventType) {
    const systemMessage: ChatMessage = {
      id: this.generateId(),
      content,
      displayedContent: content,
      isComplete: true,
      isStreaming: false,
      event,
      timestamp: Date.now(),
    };

    this.messages.push(systemMessage);
    this.scheduleScrollToBottom();
    this.cdr.detectChanges();
    console.log('🔔 Mensaje de sistema agregado:', systemMessage);
  }

  private handleError(error: any) {
    console.error('❌ Error en el stream:', error);
    this.connectionStatus$.next('error');
    this.stopTypewriter();
    this.isSending = false;

    // Finalizar mensaje actual si existe
    if (this.currentMessage && this.currentMessage.isStreaming) {
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
    }

    // Mostrar mensaje de error
    const errorMessage = error.message || 'Error desconocido en la conexión';
    this.addSystemMessage(`❌ Error: ${errorMessage}`, 'Error' as EventType);

    this.cdr.detectChanges();
  }

  private handleComplete() {
    console.log('✅ Stream completado');
    this.connectionStatus$.next('idle');
    this.stopTypewriter();
    this.isSending = false;

    // Asegurar que el último mensaje se muestre completamente
    if (this.currentMessage && this.currentMessage.isStreaming) {
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
    }

    this.cdr.detectChanges();
  }

  private scheduleScrollToBottom() {
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.warn('Error al hacer scroll:', err);
    }
  }

  private cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.stopTypewriter();
  }

  // Métodos de utilidad
  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Métodos para el template
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  getEventLabel(event: string): string {
    const labels: { [key: string]: string } = {
      UserMessage: '👤 Tú',
      RunResponse: '🤖 Asistente',
      RunCompleted: '✅ Completado',
      RunStarted: '🚀 Iniciado',
      UpdatingMemory: '🧠 Memoria',
      ToolCallStarted: '🔧 Herramienta',
      Error: '❌ Error',
    };
    return labels[event] || `📋 ${event}`;
  }

  formatTimestamp(timestamp: number): string {
    const date =
      timestamp > 1000000000000
        ? new Date(timestamp)
        : new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isUserMessage(message: ChatMessage): boolean {
    return message.event === 'UserMessage';
  }

  isSystemMessage(message: ChatMessage): boolean {
    return [
      'UpdatingMemory',
      'ToolCallStarted',
      'RunStarted',
      'Error',
    ].includes(message.event);
  }

  isBotMessage(message: ChatMessage): boolean {
    return ['RunResponse', 'RunCompleted'].includes(message.event);
  }

  getConnectionStatusText(): string {
    const status = this.connectionStatus$.value;
    const statusMap = {
      idle: 'Listo',
      connecting: 'Conectando...',
      streaming: 'Recibiendo...',
      error: 'Error',
    };
    return statusMap[status] || 'Desconocido';
  }

  getConnectionStatusClass(): string {
    const status = this.connectionStatus$.value;
    const statusClasses = {
      idle: 'bg-success animate-pulse',
      connecting: 'bg-warning animate-ping',
      streaming: 'bg-info animate-pulse',
      error: 'bg-error animate-bounce',
    };
    return statusClasses[status] || 'bg-base-300';
  }

  handleKeyDown(event: KeyboardEvent) {
    // Enviar con Enter (sin Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  cancelSending() {
    this.cleanup();
    this.isSending = false;
    this.connectionStatus$.next('idle');
    this.addSystemMessage(
      '🚫 Envío cancelado por el usuario',
      'Cancelled' as EventType
    );
  }

  ngOnDestroy() {
    this.cleanup();
    this.connectionStatus$.complete();
  }
}
