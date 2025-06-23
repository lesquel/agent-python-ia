import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export type ConnectionStatus = "idle" | "connecting" | "streaming" | "error"

@Injectable({
  providedIn: "root",
})
export class ConnectionStatusService {
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>("idle")

  /**
   * Observable del estado de conexión
   */
  get status$() {
    return this.connectionStatus$.asObservable()
  }

  /**
   * Valor actual del estado
   */
  get currentStatus(): ConnectionStatus {
    return this.connectionStatus$.value
  }

  /**
   * Actualiza el estado de conexión
   */
  setStatus(status: ConnectionStatus): void {
    this.connectionStatus$.next(status)
  }

  /**
   * Obtiene el texto descriptivo del estado
   */
  getStatusText(): string {
    const statusMap = {
      idle: "Listo",
      connecting: "Conectando...",
      streaming: "Recibiendo...",
      error: "Error",
    }
    return statusMap[this.currentStatus] || "Desconocido"
  }

  /**
   * Obtiene las clases CSS para el indicador visual
   */
  getStatusClass(): string {
    const statusClasses = {
      idle: "bg-success animate-pulse",
      connecting: "bg-warning animate-ping",
      streaming: "bg-info animate-pulse",
      error: "bg-error animate-bounce",
    }
    return statusClasses[this.currentStatus] || "bg-base-300"
  }

  /**
   * Limpia el servicio
   */
  destroy(): void {
    this.connectionStatus$.complete()
  }
}
