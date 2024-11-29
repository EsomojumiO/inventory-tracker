import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

const Notification = () => {
  const { notification, hideNotification } = useNotification();

  if (!notification) return null;

  return (
    <Snackbar
      open={Boolean(notification)}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={hideNotification} 
        severity={notification?.type || 'info'} 
        variant="filled"
        elevation={6}
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
