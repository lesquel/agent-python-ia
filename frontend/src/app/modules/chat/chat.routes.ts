import { Routes } from '@angular/router';
import { Chat } from './pages/chat/chat';
import { chatConfigRoutes } from './config/chat-config-route';

export const chatRoutes: Routes = [
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
