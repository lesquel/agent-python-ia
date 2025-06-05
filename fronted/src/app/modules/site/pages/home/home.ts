// import { RouterLink } from '@angular/router';
// import { siteConfigRoutes } from '../../config/site-config.routes';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { AgentList } from "../../../agent/components/agent-list/agent-list";
import { SidebarComponent } from "../../components/sidebar/sidebar";
import { InputText } from "../../components/input-text/input-text";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AgentList,
    SidebarComponent,
    CommonModule,
    InputText
  ],
  templateUrl: './home.html'
})

export class Home {
  sidebarVisible = true;
}
