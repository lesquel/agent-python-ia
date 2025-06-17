import { Routes } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { chatConfigRoutes } from './config/chat-config-route';
import { AComponent } from './pages/a';

export const chatRoutes: Routes = [
  {
    path: 'a',
    component: AComponent,
  },
  {
    path: chatConfigRoutes.base.path,
    children: [
      {
        path: chatConfigRoutes.children.chat.path,
        component: Chat,
      },
    ],
  },
];
