import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { siteConfigRoutes } from '../../config/site-config.routes';
import { AgentList } from "../../../agent/components/agent-list/agent-list";

@Component({
  selector: 'app-home',
  imports: [ AgentList],
  templateUrl: './home.html'
})
export class Home {
  protected siteRoutes = siteConfigRoutes;
}
