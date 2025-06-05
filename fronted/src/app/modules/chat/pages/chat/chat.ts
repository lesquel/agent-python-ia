import {
  Component,
  inject,
  input,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ChatDataService } from '../../services/chat-data-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { BotText } from '../../component/bot-text/bot-text';
import { MeText } from '../../component/me-text/me-text';
import { ChatMessage } from '../../models/chat-model';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, CommonModule, BotText, MeText],
  templateUrl: './chat.html',
})
export class Chat implements OnDestroy {
  id = input.required<string>();
  messages: ChatMessage[] = [];
  currentMessage: ChatMessage | null = null;

  private chatService = inject(ChatDataService);
  private cdr = inject(ChangeDetectorRef);
  private subscription: Subscription | null = null;
  private typewriterSubscription: Subscription | null = null;
  private fb: FormBuilder = inject(FormBuilder);

  msgForm = this.fb.group({
    message: ['', Validators.required],
  });

  isSending = false;
  typewriterSpeed = 30; // Velocidad de escritura en ms

  sendMessage() {
    if (!this.msgForm.valid) return;

    this.isSending = true;
    this.messages = [];
    this.currentMessage = null;
    this.stopTypewriter();

    // Agregar mensaje del usuario
    this.addUserMessage(this.msgForm.value.message as string);

    this.subscription = this.chatService
      .sendFormAndListenSSE({
        content: this.msgForm.value.message as string,
        agent_id: this.id(),
        event: 'RunResponse',
        run_id: this.generateId(),
        session_id: 'wrirhfioerfoi2',
        created_at: Date.now(),
        content_type: 'str',
      })
      .subscribe({
        next: (data) => this.handleStreamData(data),
        error: (err) => this.handleError(err),
        complete: () => this.handleComplete(),
      });

    // Limpiar formulario
    this.msgForm.reset();
  }

  getTimeNow() {
    return new Date().getMinutes();
  }

  private addUserMessage(content: string) {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      displayedContent: content,
      isComplete: true,
      isStreaming: false,
      event: 'UserMessage',
      timestamp: Date.now(),
    };
    this.messages.push(userMessage);
  }

  private handleStreamData(data: any) {
    console.log('Received data:', data);

    switch (data.event) {
      case 'RunResponse':
        this.handleRunResponse(data);
        break;
      case 'UpdatingMemory':
        this.addSystemMessage('Actualizando memoria...', data.event);
        break;
      case 'RunCompleted':
        this.handleRunCompleted(data);
        break;
      default:
        console.log('Evento no manejado:', data.event);
    }
  }

  private handleRunResponse(data: any) {
    // Si no hay mensaje actual o está completo, crear uno nuevo
    if (!this.currentMessage || this.currentMessage.isComplete) {
      this.currentMessage = {
        id: data.run_id || this.generateId(),
        content: '',
        displayedContent: '',
        isComplete: false,
        isStreaming: true,
        event: 'RunResponse',
        timestamp: data.created_at || Date.now(),
      };
      this.messages.push(this.currentMessage);
    }

    // Agregar el contenido fragmentado
    this.currentMessage.content += data.content;

    // Iniciar efecto de escritura si no está ya corriendo
    if (!this.typewriterSubscription) {
      this.startTypewriterEffect();
    }
  }

  private handleRunCompleted(data: any) {
    this.stopTypewriter();

    // Si tenemos un mensaje actual streaming
    if (this.currentMessage && this.currentMessage.isStreaming) {
      // Asegurar que todo el contenido se muestre
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
    }

    // Si hay contenido adicional en RunCompleted que es diferente
    if (data.content && data.content !== this.currentMessage?.content) {
      const finalMessage: ChatMessage = {
        id: data.run_id || this.generateId(),
        content: data.content,
        displayedContent: '', // Comenzará vacío para efecto de escritura
        isComplete: false,
        isStreaming: true,
        event: 'RunCompleted',
        timestamp: data.created_at || Date.now(),
        rawContent: data.content,
      };

      this.messages.push(finalMessage);
      this.currentMessage = finalMessage;
      this.startTypewriterEffect();
    }

    this.cdr.detectChanges();
  }

  private startTypewriterEffect() {
    if (this.typewriterSubscription) {
      return; // Ya está corriendo
    }

    this.typewriterSubscription = interval(this.typewriterSpeed).subscribe(
      () => {
        if (!this.currentMessage) {
          this.stopTypewriter();
          return;
        }

        const fullContent = this.currentMessage.content;
        const displayedLength = this.currentMessage.displayedContent.length;

        if (displayedLength < fullContent.length) {
          // Agregar siguiente caracter
          this.currentMessage.displayedContent = fullContent.substring(
            0,
            displayedLength + 1
          );
          this.cdr.detectChanges();
        } else if (this.currentMessage.isComplete) {
          // El mensaje está completo y se ha mostrado todo
          this.currentMessage.isStreaming = false;
          this.stopTypewriter();
        }
      }
    );
  }

  private stopTypewriter() {
    if (this.typewriterSubscription) {
      this.typewriterSubscription.unsubscribe();
      this.typewriterSubscription = null;
    }
  }

  private addMessage(
    content: string,
    event: string,
    id?: string,
    timestamp?: number
  ) {
    const message: ChatMessage = {
      id: id || this.generateId(),
      content,
      displayedContent: content,
      isComplete: true,
      isStreaming: false,
      event,
      timestamp: timestamp || Date.now(),
    };
    this.messages.push(message);
  }

  private addSystemMessage(content: string, event: string) {
    this.addMessage(content, event);
  }

  private handleError(err: any) {
    console.error('Error en el stream:', err);
    this.stopTypewriter();
    this.addMessage(`Error: ${err}`, 'Error');
    this.isSending = false;

    if (this.currentMessage) {
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
    }
  }

  private handleComplete() {
    console.log('Stream completado');
    this.stopTypewriter();

    if (this.currentMessage) {
      // Asegurar que todo el contenido se muestre
      this.currentMessage.displayedContent = this.currentMessage.content;
      this.currentMessage.isComplete = true;
      this.currentMessage.isStreaming = false;
    }

    this.addSystemMessage('Conexión finalizada.', 'ConnectionClosed');
    this.isSending = false;
    this.cdr.detectChanges();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  getEventLabel(event: string): string {
    const labels: { [key: string]: string } = {
      UserMessage: 'Tú',
      RunResponse: 'Respuesta',
      RunCompleted: 'Completado',
      UpdatingMemory: 'Memoria',
      ConnectionClosed: 'Desconectado',
      Error: 'Error',
    };
    return labels[event] || event;
  }

  formatTimestamp(timestamp: number): string {
    // Verificar si el timestamp está en segundos o milisegundos
    const date =
      timestamp > 1000000000000
        ? new Date(timestamp)
        : new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  }

  formatMessageContent(content: string): string {
    if (!content) return '';

    // Convertir markdown básico a HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#{1,6}\s(.*)$/gm, (match, p1) => {
        const level = match.indexOf(' ');
        return `<h${level}>${p1}</h${level}>`;
      })
      .replace(/\n/g, '<br>');
  }

  // Método para obtener el contenido que se debe mostrar
  getDisplayContent(message: ChatMessage): string {
    return this.formatMessageContent(message.displayedContent);
  }

  // Método para verificar si un mensaje es del usuario
  isUserMessage(message: ChatMessage): boolean {
    return message.event === 'UserMessage';
  }

  // Método para verificar si un mensaje es del sistema
  isSystemMessage(message: ChatMessage): boolean {
    return !['UserMessage', 'RunResponse', 'RunCompleted'].includes(
      message.event
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.stopTypewriter();
  }
}
