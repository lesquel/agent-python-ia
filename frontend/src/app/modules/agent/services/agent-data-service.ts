import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import { adaptAgent, adaptAgents } from '../adapters/agent-adapter';

@Injectable({
  providedIn: 'root',
})
export class AgentDataService {
  private agentsDirectUrl = environment.agentsDirectUrl;
  getAgents() {
    return httpResource(() => this.agentsDirectUrl, {
      parse: (response: any) => {
        console.log(response);
        return adaptAgents(response);
      },
    });
  }

}
