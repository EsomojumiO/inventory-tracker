export const API_URL = 'http://localhost:3000/api';

export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  SUPPLIER_UPDATE: 'supplier_update',
  PAYMENT_RECEIVED: 'payment_received',
  STOCK_TRANSFER: 'stock_transfer',
};

export const NOTIFICATION_CHANNELS = {
  INVENTORY_ALERTS: 'inventory-alerts',
  ORDERS: 'orders',
};

export const NOTIFICATION_TOPICS = {
  ALL_ALERTS: 'all_alerts',
  LOW_STOCK: 'low_stock',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
};

export const APP_THEME = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    error: '#B00020',
    text: '#000000',
    onSurface: '#000000',
    disabled: '#BDBDBD',
    placeholder: '#9E9E9E',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#FF4081',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    body1: {
      fontSize: 16,
    },
    body2: {
      fontSize: 14,
    },
    caption: {
      fontSize: 12,
    },
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  FCM_TOKEN: 'fcmToken',
  SETTINGS: 'appSettings',
  LAST_SYNC: 'lastSync',
};

export const DEFAULT_SETTINGS = {
  notifications: {
    lowStock: true,
    newOrders: true,
    orderUpdates: true,
    supplierUpdates: true,
    payments: true,
  },
  sync: {
    autoSync: true,
    syncInterval: 15, // minutes
  },
  display: {
    theme: 'light',
    language: 'en',
  },
};
