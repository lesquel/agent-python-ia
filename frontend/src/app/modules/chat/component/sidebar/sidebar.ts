import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatButtonComponent } from '../chat-button/chat-button';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { siteConfigRoutes } from '@modules/site/config/site-config.routes';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ChatButtonComponent, RouterLink, MatIconModule],
  templateUrl: './sidebar.html'
})

export class SidebarComponent {
  readonly siteRoutesConfig = siteConfigRoutes;
}
