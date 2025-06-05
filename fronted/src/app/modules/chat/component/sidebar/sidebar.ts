import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatButtonComponent } from '../chat-button/chat-button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ChatButtonComponent],
  templateUrl: './sidebar.html'
})

export class SidebarComponent {
}
