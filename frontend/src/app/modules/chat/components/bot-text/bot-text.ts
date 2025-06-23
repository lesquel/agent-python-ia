import { Component, input } from '@angular/core';
import { ChatMessage } from '../../models/chat-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bot-text',
  imports: [CommonModule],
  templateUrl: './bot-text.html',
})
export class BotText {
  message = input.required<ChatMessage>();
  displayContent = input.required<string>();
  label = input.required<string>();
  timestamp = input.required<string>();
}
