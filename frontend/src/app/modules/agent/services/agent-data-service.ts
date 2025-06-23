import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import { adaptAgent, adaptAgents } from '../adapters/agent-adapter';

@Injectable({
  providedIn: 'root',
})
export class AgentDataService {
  private apiAgents = environment.apiAgents;
  private urlAgents = '/v1/playground/agents';
  getAgents() {
    return httpResource(() => this.apiAgents + this.urlAgents, {
      parse: (response: any) => {
        console.log(response);
        return adaptAgents(response);
      },
    });
  }

  getAgentById(id: string) {
    return httpResource(() => this.apiAgents + this.urlAgents + '/' + id, {
      parse: (response: any) => {
        console.log(response);
        return adaptAgent(response);
      },
    });
  }
}
