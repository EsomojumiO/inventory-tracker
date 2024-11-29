import React from 'react';
import { Box, Container, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import MainHeader from './MainHeader';

const MainLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <MainHeader />
            <Toolbar /> {/* Spacer for fixed header */}
            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
                <Outlet />
            </Container>
        </Box>
    );
};

export default MainLayout;
