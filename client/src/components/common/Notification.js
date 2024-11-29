import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useNotification } from '../../hooks/useNotification';

const Notification = () => {
  const { notification, closeNotification } = useNotification();

  if (!notification) return null;

  return (
    <Snackbar
      open={!!notification}
      autoHideDuration={6000}
      onClose={closeNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={closeNotification}
        severity={notification.type}
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;
