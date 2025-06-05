export const chatConfigRoutes = {
  base: {
    path: 'chat',
    url: '/chat',
  },
  children: {
    chat: {
      path: ':id',
      url: '/chat/:id',
    },
  },
};