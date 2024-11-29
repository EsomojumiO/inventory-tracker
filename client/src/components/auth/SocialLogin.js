import React from 'react';
import { Button, Stack, Typography, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const SocialLogin = () => {
    const { socialLogin } = useAuth();
    const { notify } = useNotification();

    const handleGoogleLogin = async () => {
        try {
            window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/google`;
        } catch (error) {
            notify('Failed to initialize Google login', 'error');
        }
    };

    const handleAppleLogin = async () => {
        try {
            window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/apple`;
        } catch (error) {
            notify('Failed to initialize Apple login', 'error');
        }
    };

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
                Or continue with
            </Typography>
            <Stack spacing={2}>
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    sx={{
                        borderColor: '#4285F4',
                        color: '#4285F4',
                        '&:hover': {
                            borderColor: '#2b6cd4',
                            backgroundColor: 'rgba(66, 133, 244, 0.04)'
                        }
                    }}
                >
                    Continue with Google
                </Button>
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AppleIcon />}
                    onClick={handleAppleLogin}
                    sx={{
                        borderColor: '#000000',
                        color: '#000000',
                        '&:hover': {
                            borderColor: '#333333',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    Continue with Apple
                </Button>
            </Stack>
        </Box>
    );
};

export default SocialLogin;
