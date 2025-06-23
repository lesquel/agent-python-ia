import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentModel } from '@app/modules/agent/models/agent-model';
import { chatConfigRoutes } from '@app/modules/chat/config/chat-config-route';

@Component({
  selector: 'app-agent-card',
  imports: [RouterLink],
  templateUrl: './agent-card.html'
})
export class AgentCard {
  agent = input.required<AgentModel>();
  protected chatRoutes = chatConfigRoutes;
}
