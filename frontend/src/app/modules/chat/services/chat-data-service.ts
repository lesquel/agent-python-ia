import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { createParser, type EventSourceMessage } from 'eventsource-parser';
import { BaseAgentEvent } from '../models/chat-model';

@Injectable({
  providedIn: 'root',
})
export class ChatDataService {
  private abortController: AbortController | null = null;

  sendFormAndListenSSE(baseAgentEvent: BaseAgentEvent): Observable<BaseAgentEvent> {
    const { content, agent_id } = baseAgentEvent;
    const url = `http://localhost:7777/v1/playground/agents/${agent_id}/runs`;
    
    const formData = new FormData();
    formData.append('message', content);
    formData.append('stream', 'true');
    formData.append('monitor', 'false');
    formData.append('session_id', baseAgentEvent.session_id || 'default_session');
    formData.append('user_id', baseAgentEvent.run_id || 'default_user');

    // Cancelar stream anterior si existe
    this.cancelActiveStream();
    this.abortController = new AbortController();

    return new Observable<BaseAgentEvent>((observer: Observer<BaseAgentEvent>) => {
      console.log('🚀 Iniciando SSE stream para agente:', agent_id);
      
      fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController?.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('No se recibió body en la respuesta');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          
          const parser = createParser({
            onEvent(event: EventSourceMessage) {
              console.log('📨 Evento SSE recibido:', event);
              
              // Ignorar eventos de keep-alive
              if (event.event === 'ping' || event.data === '') {
                return;
              }

              try {
                const parsed: BaseAgentEvent = JSON.parse(event.data);
                console.log('✅ Evento parseado:', parsed);
                observer.next(parsed);
              } catch (parseError) {
                console.warn('⚠️ Error parseando evento SSE:', parseError, 'Data:', event.data);
                // No enviar error por eventos malformados individuales
              }
            },
          });

          const processChunk = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  console.log('✅ Stream SSE completado');
                  observer.complete();
                  return;
                }

                const chunk = decoder.decode(value, { stream: true });
                console.log('📦 Chunk recibido:', chunk);
                
                // Alimentar el parser con el chunk
                parser.feed(chunk);
                
                // Continuar leyendo
                processChunk();
              })
              .catch((readError) => {
                console.error('❌ Error leyendo stream:', readError);
                observer.error(readError);
              });
          };

          // Iniciar lectura
          processChunk();
        })
        .catch((fetchError) => {
          console.error('❌ Error en fetch SSE:', fetchError);
          
          if (fetchError.name === 'AbortError') {
            console.log('🚫 Stream cancelado por el usuario');
            observer.complete();
          } else {
            observer.error(fetchError);
          }
        });

      // Cleanup function
      return () => {
        console.log('🧹 Limpiando suscripción SSE');
        this.cancelActiveStream();
      };
    });
  }

  cancelActiveStream() {
    if (this.abortController) {
      console.log('🚫 Cancelando stream activo');
      this.abortController.abort();
      this.abortController = null;
    }
  }
}