import React, { createContext, useContext, useCallback } from 'react';
import { useSnackbar } from 'notistack';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const showNotification = useCallback((message, type = 'default') => {
    enqueueSnackbar(message, {
      variant: type,
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      },
    });
  }, [enqueueSnackbar]);

  const showSuccess = useCallback((message) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showWarning = useCallback((message) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message) => {
    showNotification(message, 'info');
  }, [showNotification]);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    notify: showNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
