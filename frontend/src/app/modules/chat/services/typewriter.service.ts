import { Injectable } from "@angular/core"
import { interval, type Subscription } from "rxjs"
import type { ChatMessage } from "../models/chat-model"

@Injectable({
  providedIn: "root",
})
export class TypewriterService {
  private typewriterSubscription: Subscription | null = null
  private readonly defaultSpeed = 25 // ms entre caracteres

  /**
   * Inicia el efecto typewriter para un mensaje
   */
  startTypewriter(message: ChatMessage, onUpdate: () => void, speed: number = this.defaultSpeed): void {
    if (this.typewriterSubscription || !message) {
      return
    }

    console.log("⌨️ Iniciando efecto typewriter")

    this.typewriterSubscription = interval(speed).subscribe(() => {
      if (!message) {
        this.stopTypewriter()
        return
      }

      const fullContent = message.content
      const displayedLength = message.displayedContent.length

      if (displayedLength < fullContent.length) {
        // Agregar siguiente carácter
        message.displayedContent = fullContent.substring(0, displayedLength + 1)
        onUpdate()
      } else {
        // Contenido completamente mostrado
        if (message.isComplete || !message.isStreaming) {
          message.isStreaming = false
          this.stopTypewriter()
        }
      }
    })
  }

  /**
   * Detiene el efecto typewriter
   */
  stopTypewriter(): void {
    if (this.typewriterSubscription) {
      console.log("⏹️ Deteniendo efecto typewriter")
      this.typewriterSubscription.unsubscribe()
      this.typewriterSubscription = null
    }
  }

  /**
   * Verifica si el typewriter está activo
   */
  isActive(): boolean {
    return !!this.typewriterSubscription
  }

  /**
   * Completa inmediatamente el mensaje sin animación
   */
  completeMessage(message: ChatMessage): void {
    this.stopTypewriter()
    if (message && message.isStreaming) {
      message.displayedContent = message.content
      message.isComplete = true
      message.isStreaming = false
    }
  }
}
