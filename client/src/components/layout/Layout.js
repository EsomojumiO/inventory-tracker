import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import MainHeader from './MainHeader';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MainHeader />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
