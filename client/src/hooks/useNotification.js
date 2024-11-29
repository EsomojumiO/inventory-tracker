import { createContext, useContext, useCallback } from 'react';
import { useSnackbar } from 'notistack';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const notify = useCallback((message, variant = 'info') => {
    enqueueSnackbar(message, { 
      variant,
      autoHideDuration: variant === 'error' ? 6000 : 3000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  }, [enqueueSnackbar]);

  const showSuccess = useCallback((message) => {
    notify(message, 'success');
  }, [notify]);

  const showError = useCallback((message) => {
    notify(message, 'error');
  }, [notify]);

  const showInfo = useCallback((message) => {
    notify(message, 'info');
  }, [notify]);

  const showWarning = useCallback((message) => {
    notify(message, 'warning');
  }, [notify]);

  const value = {
    notify,
    showSuccess,
    showError,
    showInfo,
    showWarning,
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
