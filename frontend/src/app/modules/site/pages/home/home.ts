import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { siteConfigRoutes } from '../../config/site-config.routes';
import { AgentList } from "../../../agent/components/agent-list/agent-list";
import { Banner } from "../../components/banner/banner";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AgentList,
    Banner
],
  templateUrl: './home.html'
})
export class Home {
  protected siteRoutes = siteConfigRoutes;
}
