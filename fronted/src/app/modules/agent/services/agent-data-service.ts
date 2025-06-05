import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment.development';
import { adaptAgents } from '../adapters/agent-adapter';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgentDataService {
  private apiAgents = environment.apiAgents;
  private urlAgents = '/v1/playground/agents';
  private httpClient = inject(HttpClient);
  getAgents() {
    return httpResource(() => this.apiAgents + this.urlAgents, {
      parse: (response: any) => adaptAgents(response),
    });
  }
}
