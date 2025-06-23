import { Component, input } from '@angular/core';

@Component({
  selector: 'app-header-chat',
  imports: [],
  templateUrl: './header-chat.html'
})
export class HeaderChat {
  agentId = input<string>();
  
}
