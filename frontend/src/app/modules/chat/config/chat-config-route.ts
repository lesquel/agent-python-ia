export const chatConfigRoutes = {
  base: {
    path: 'chat',
    url: '/chat',
  },
  children: {
    chat: {
      path: ':agentId',
      url: '/chat/:agentId',
    },
  },
};