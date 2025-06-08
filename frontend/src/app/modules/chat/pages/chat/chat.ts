import {
  Component,
  inject,
  input,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { ChatDataService } from '../../services/chat-data-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, interval, BehaviorSubject } from 'rxjs';
import { ChatMessage, EventType, ContentType, BaseAgentEvent } from '../../models/chat-model';
import { SidebarComponent } from '../../component/sidebar/sidebar';
import { MarkdownModule, provideMarkdown } from 'ngx-markdown';

@Component({
  selector: 'app-chat',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SidebarComponent,
    MarkdownModule,
  ],
  providers: [provideMarkdown()],
  templateUrl: './chat.html',
})
export class Chat implements OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer', { static: false })
  private messagesContainer!: ElementRef;

  id = input.required<string>();

  // Estado reactivo
  messages: ChatMessage[] = [];
  currentMessage: ChatMessage | null = null;
  isSending = false;
  connectionStatus$ = new BehaviorSubject<'idle' | 'connecting' | 'streaming' | 'error'>('idle');

  // Servicios
  private chatService = inject(ChatDataService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // Subscripciones
  private subscription: Subscription | null = null;
  private typewriterSubscription: Subscription | null = null;

  // Configuración
  private readonly typewriterSpeed = 25; // ms entre caracteres
  private shouldScrollToBottom = false;

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

    // Crear el evento base
    const baseEvent: BaseAgentEvent = {
      content,
      agent_id: this.id(),
      event: 'UserMessage' as EventType,
      run_id: this.generateId(),
      session_id: this.generateSessionId(),
      created_at: Date.now(),
      content_type: 'text' as any, // Cast temporal
    };

    console.log('📤 Enviando evento:', baseEvent);

    // Iniciar stream
    this.subscription = this.chatService
      .sendFormAndListenSSE(baseEvent)
      .subscribe({
        next: (data) => {
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

  private handleStreamData(data: any) {
    console.log('📨 Procesando datos del stream:', data);
    this.connectionStatus$.next('streaming');

    // Asegurar que tenemos la estructura correcta
    if (!data.event) {
      console.warn('⚠️ Evento sin tipo:', data);
      return;
    }

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
        this.addSystemMessage('🧠 Actualizando memoria del agente...', data.event);
        break;
      case 'ToolCall':
        this.addSystemMessage(
          `🔧 Ejecutando herramienta: ${data.tool_name || 'desconocida'}`,
          data.event
        );
        break;
      default:
        console.log('ℹ️ Evento no manejado:', data.event, data);
        // Tratar eventos desconocidos como respuestas del bot si tienen contenido
        if (data.content) {
          this.handleRunResponse(data);
        }
    }
  }

  private handleRunStarted(data: any) {
    console.log('🚀 Ejecución iniciada:', data);
    this.addSystemMessage('🤖 El agente está procesando tu solicitud...', data.event);
  }

  private handleRunResponse(data: any) {
    console.log('🤖 Respuesta del run:', data);

    // Crear nuevo mensaje si no existe o el actual está completo
    if (!this.currentMessage || this.currentMessage.isComplete) {
      this.currentMessage = {
        id: data.run_id || this.generateId(),
        content: '',
        displayedContent: '',
        isComplete: false,
        isStreaming: true,
        event: 'RunResponse' as EventType,
        timestamp: data.created_at || Date.now(),
      };
      this.messages.push(this.currentMessage);
      this.scheduleScrollToBottom();
      console.log('📝 Nuevo mensaje de bot creado:', this.currentMessage);
    }

    // Acumular contenido
    if (data.content) {
      this.currentMessage.content += data.content;
      console.log('📝 Contenido acumulado:', this.currentMessage.content);

      // Iniciar efecto typewriter si no está activo
      if (!this.typewriterSubscription) {
        this.startTypewriterEffect();
      }
    }

    this.cdr.detectChanges();
  }

  private handleRunCompleted(data: any) {
    console.log('✅ Ejecución completada:', data);
    this.stopTypewriter();

    // Finalizar mensaje actual
    if (this.currentMessage && this.currentMessage.isStreaming) {
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
      console.log('✅ Mensaje finalizado:', this.currentMessage);
    }

    // Si hay contenido final diferente, agregarlo
    if (data.content && (!this.currentMessage || data.content !== this.currentMessage.content)) {
      this.addBotMessage(data.content, 'RunCompleted', data.run_id, data.created_at);
    }

    this.scheduleScrollToBottom();
    this.cdr.detectChanges();
  }

  private addBotMessage(content: string, event: EventType, id?: string, timestamp?: number) {
    const botMessage: ChatMessage = {
      id: id || this.generateId(),
      content,
      displayedContent: '', // Comenzará vacío para efecto typewriter
      isComplete: false,
      isStreaming: true,
      event,
      timestamp: timestamp || Date.now(),
    };

    this.messages.push(botMessage);
    this.currentMessage = botMessage;
    this.startTypewriterEffect();
    this.scheduleScrollToBottom();
    console.log('🤖 Mensaje de bot agregado:', botMessage);
  }

  private startTypewriterEffect() {
    if (this.typewriterSubscription || !this.currentMessage) {
      return;
    }

    console.log('⌨️ Iniciando efecto typewriter');
    this.typewriterSubscription = interval(this.typewriterSpeed).subscribe(() => {
      if (!this.currentMessage) {
        this.stopTypewriter();
        return;
      }

      const fullContent = this.currentMessage.content;
      const displayedLength = this.currentMessage.displayedContent.length;

      if (displayedLength < fullContent.length) {
        // Agregar siguiente carácter
        this.currentMessage.displayedContent = fullContent.substring(0, displayedLength + 1);
        this.scheduleScrollToBottom();
        this.cdr.detectChanges();
      } else {
        // Contenido completamente mostrado
        if (this.currentMessage.isComplete || !this.currentMessage.isStreaming) {
          this.currentMessage.isStreaming = false;
          this.stopTypewriter();
        }
      }
    });
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
    this.chatService.cancelActiveStream();
  }

  // Métodos de utilidad
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      ToolCall: '🔧 Herramienta',
      Error: '❌ Error',
    };
    return labels[event] || `📋 ${event}`;
  }

  formatTimestamp(timestamp: number): string {
    const date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isUserMessage(message: ChatMessage): boolean {
    return message.event === 'UserMessage';
  }

  isSystemMessage(message: ChatMessage): boolean {
    return ['UpdatingMemory', 'ToolCall', 'RunStarted', 'Error'].includes(message.event);
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
    this.addSystemMessage('🚫 Envío cancelado por el usuario', 'Cancelled' as EventType);
  }

  ngOnDestroy() {
    this.cleanup();
    this.connectionStatus$.complete();
  }
}