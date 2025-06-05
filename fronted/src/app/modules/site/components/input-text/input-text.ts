import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'input-text',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './input-text.html',
})
export class InputText {

    // message: string = '';

    // sendMessage() {
    //     if (this.message.trim()) {
    //     console.log('Mensaje enviado:', this.message);
    //     // Aquí puedes emitir el mensaje o procesarlo como desees
    //     this.message = ''; // Limpia el input después de enviar
    //     }
    // }
}
