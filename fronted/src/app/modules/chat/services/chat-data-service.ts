import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { BaseAgentEvent } from '../models/chat-model';

@Injectable({
  providedIn: 'root',
})
export class ChatDataService {
  private ngZone = inject(NgZone);

  sendFormAndListenSSE(baseAgentEvent: BaseAgentEvent): Observable<any> {
    const { content, agent_id } = baseAgentEvent;
    const url = `http://localhost:7777/v1/playground/agents/${agent_id}/runs`;
    
    const formData = new FormData();
    formData.append('message', content);
    formData.append('stream', 'true');
    formData.append('monitor', 'false');
    formData.append('session_id', 'ewrverver');
    formData.append('user_id', 'vrerkvnerlk');

    return new Observable<BaseAgentEvent>((observer) => {
      // Ejecutar fetch fuera de Angular zone para mejor rendimiento
      this.ngZone.runOutsideAngular(() => {
        fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        })
          .then((response) => {
            if (!response.ok || !response.body) {
              this.ngZone.run(() => {
                observer.error(`Error: ${response.status} ${response.statusText}`);
              });
              return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            const readChunk = () => {
              reader
                .read()
                .then(({ done, value }) => {
                  if (done) {
                    this.ngZone.run(() => {
                      // Procesar cualquier datos restantes en el buffer
                      if (buffer.trim()) {
                        this.processBuffer(buffer, observer);
                      }
                      observer.complete();
                    });
                    return;
                  }

                  // Decodificar el chunk
                  const chunk = decoder.decode(value, { stream: true });
                  buffer += chunk;

                  console.log('Chunk recibido:', chunk);
                  console.log('Buffer actual:', buffer);

                  // Procesar el buffer en Angular zone
                  this.ngZone.run(() => {
                    buffer = this.processBuffer(buffer, observer);
                  });

                  // Continuar leyendo
                  readChunk();
                })
                .catch((err) => {
                  this.ngZone.run(() => {
                    observer.error(err);
                  });
                });
            };

            readChunk();
          })
          .catch((err) => {
            this.ngZone.run(() => {
              observer.error(err);
            });
          });
      });
    });
  }

  private processBuffer(buffer: string, observer: Observer<BaseAgentEvent>): string {
    let remainingBuffer = buffer;

    try {
      // Método 1: Intentar dividir por líneas y procesar cada una
      const lines = buffer.split('\n');
      let processedLines = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) continue;

        // Intentar parsear como JSON
        if (this.tryParseAndEmit(line, observer)) {
          processedLines = i + 1;
          continue;
        }

        // Si no es JSON válido, intentar acumular con la siguiente línea
        if (i < lines.length - 1) {
          const combinedLine = line + lines[i + 1];
          if (this.tryParseAndEmit(combinedLine, observer)) {
            processedLines = i + 2;
            i++; // Saltar la siguiente línea ya que la procesamos
            continue;
          }
        }
      }

      // Remover las líneas procesadas del buffer
      if (processedLines > 0) {
        remainingBuffer = lines.slice(processedLines).join('\n');
      }

      // Método 2: Buscar objetos JSON concatenados (}{)
      const jsonPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      let match;
      let lastIndex = 0;

      while ((match = jsonPattern.exec(remainingBuffer)) !== null) {
        const jsonStr = match[0];
        
        if (this.tryParseAndEmit(jsonStr, observer)) {
          lastIndex = match.index + jsonStr.length;
        }
      }

      // Actualizar buffer con contenido no procesado
      if (lastIndex > 0) {
        remainingBuffer = remainingBuffer.substring(lastIndex);
      }

      // Método 3: Dividir por }{ para objetos JSON concatenados
      if (remainingBuffer.includes('}{')) {
        const jsonObjects = remainingBuffer.split('}{');
        let processedObjects = 0;

        jsonObjects.forEach((jsonStr, index) => {
          // Agregar llaves faltantes excepto para el primero y último
          let fullJsonStr = jsonStr;
          if (index > 0) fullJsonStr = '{' + fullJsonStr;
          if (index < jsonObjects.length - 1) fullJsonStr = fullJsonStr + '}';

          if (this.tryParseAndEmit(fullJsonStr, observer)) {
            processedObjects = index + 1;
          }
        });

        // Mantener solo el último objeto no procesado
        if (processedObjects < jsonObjects.length) {
          remainingBuffer = jsonObjects.slice(processedObjects).join('}{');
        } else {
          remainingBuffer = '';
        }
      }

    } catch (error) {
      console.warn('Error procesando buffer:', error);
    }

    return remainingBuffer;
  }

  private tryParseAndEmit(jsonStr: string, observer: Observer<BaseAgentEvent>): boolean {
    try {
      // Limpiar cadena
      const cleanJsonStr = jsonStr.trim();
      if (!cleanJsonStr || !cleanJsonStr.startsWith('{') || !cleanJsonStr.endsWith('}')) {
        return false;
      }

      const parsed: BaseAgentEvent = JSON.parse(cleanJsonStr);
      
      // Validar que tiene las propiedades mínimas esperadas
      if (parsed && typeof parsed === 'object' && parsed.event) {
        console.log('JSON parseado exitosamente:', parsed);
        observer.next(parsed);
        return true;
      }
    } catch (error) {
      console.warn('No se pudo parsear JSON:', jsonStr, error);
    }
    
    return false;
  }
}