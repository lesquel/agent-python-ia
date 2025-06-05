import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AgentDataService } from '../../services/agent-data-service';
import { AgentCard } from "./agent-card/agent-card";

@Component({
  selector: 'app-agent-list',
  imports: [AgentCard],
  templateUrl: './agent-list.html',
})
export class AgentList {
  private agentService = inject(AgentDataService);
  protected agents = this.agentService.getAgents();

}
