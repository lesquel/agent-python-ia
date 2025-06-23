import { Injectable, type ElementRef } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class ScrollManagerService {
  private shouldScrollToBottom = false

  /**
   * Programa un scroll hacia abajo en el próximo ciclo
   */
  scheduleScrollToBottom(): void {
    this.shouldScrollToBottom = true
  }

  /**
   * Ejecuta el scroll si está programado
   */
  executeScheduledScroll(container: ElementRef): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom(container)
      this.shouldScrollToBottom = false
    }
  }

  /**
   * Hace scroll hacia abajo inmediatamente
   */
  scrollToBottom(container: ElementRef): void {
    try {
      if (container?.nativeElement) {
        const element = container.nativeElement
        element.scrollTop = element.scrollHeight
      }
    } catch (err) {
      console.warn("Error al hacer scroll:", err)
    }
  }

  /**
   * Verifica si hay scroll programado
   */
  hasScheduledScroll(): boolean {
    return this.shouldScrollToBottom
  }

  /**
   * Cancela el scroll programado
   */
  cancelScheduledScroll(): void {
    this.shouldScrollToBottom = false
  }
}
