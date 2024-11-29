import React from 'react';
import { CircularProgress, Backdrop } from '@mui/material';

const LoadingSpinner = ({ open }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      open={open}
    >
      <CircularProgress color="primary" />
    </Backdrop>
  );
};

export default LoadingSpinner;
