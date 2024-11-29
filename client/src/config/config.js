const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001',
  TOKEN_KEY: 'inventory_token',
  REFRESH_TOKEN_KEY: 'inventory_refresh_token',
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
