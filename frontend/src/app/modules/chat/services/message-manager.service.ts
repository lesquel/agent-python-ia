import { Injectable, inject } from '@angular/core';
import type { ChatMessage, EventType } from '../models/chat-model';
import { ChatUtilsService } from './chat-utils.service';

@Injectable({
  providedIn: 'root',
})
export class MessageManagerService {
  private chatUtils = inject(ChatUtilsService);

  /**
   * Agrega un mensaje a la lista
   */
  addMessage(messages: ChatMessage[], message: ChatMessage): void {
    messages.push(message);
    console.log(`📝 Mensaje agregado: ${message.event}`, message);
  }

  /**
   * Agrega un mensaje de usuario
   */
  addUserMessage(messages: ChatMessage[], content: string): ChatMessage {
    const userMessage = this.chatUtils.createUserMessage(content);
    this.addMessage(messages, userMessage);
    return userMessage;
  }

  /**
   * Agrega un mensaje del sistema
   */
  addSystemMessage(
    messages: ChatMessage[],
    content: string,
    event: EventType
  ): ChatMessage {
    const systemMessage = this.chatUtils.createSystemMessage(content, event);
    this.addMessage(messages, systemMessage);
    return systemMessage;
  }

  /**
   * Agrega un mensaje de error
   */
  addErrorMessage(messages: ChatMessage[], content: string): ChatMessage {
    const errorMessage = this.chatUtils.createSystemMessage(
      content,
      'Error' as EventType
    );
    this.addMessage(messages, errorMessage);
    return errorMessage;
  }

  /**
   * Crea un nuevo mensaje de bot
   */
  createBotMessage(
    messages: ChatMessage[],
    runId: string,
    timestamp?: number
  ): ChatMessage {
    const botMessage = this.chatUtils.createBotMessage(runId, timestamp);
    this.addMessage(messages, botMessage);
    return botMessage;
  }

  /**
   * Finaliza un mensaje (completa el streaming)
   */
  completeMessage(message: ChatMessage): void {
    if (message && message.isStreaming) {
      message.displayedContent = message.content;
      message.isComplete = true;
      message.isStreaming = false;
      console.log('✅ Mensaje completado:', message.id);
    }
  }

  /**
   * Limpia todos los mensajes
   */
  clearMessages(messages: ChatMessage[]): void {
    messages.length = 0;
    console.log('🗑️ Mensajes limpiados');
  }

  /**
   * Busca un mensaje por ID
   */
  findMessageById(
    messages: ChatMessage[],
    id: string
  ): ChatMessage | undefined {
    return messages.find((msg) => msg.id === id);
  }

  /**
   * Obtiene estadísticas de mensajes
   */
  getMessageStats(messages: ChatMessage[]) {
    return {
      total: messages.length,
      user: messages.filter((m) => this.chatUtils.isUserMessage(m)).length,
      bot: messages.filter((m) => this.chatUtils.isBotMessage(m)).length,
      system: messages.filter((m) => this.chatUtils.isSystemMessage(m)).length,
      error: messages.filter((m) => this.chatUtils.isErrorMessage(m)).length,
    };
  }
}
