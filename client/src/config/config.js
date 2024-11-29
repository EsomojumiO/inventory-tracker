const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001',
  tokenKey: 'inventory_token',
  refreshTokenKey: 'inventory_refresh_token',
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      verify: '/auth/verify',
      refresh: '/auth/refresh'
    },
    inventory: '/inventory',
    suppliers: '/suppliers',
    customers: '/customers',
    orders: '/orders',
    pos: '/pos',
    analytics: '/analytics'
  }
};

export default config;
