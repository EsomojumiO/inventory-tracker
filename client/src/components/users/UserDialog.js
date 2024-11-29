import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Box,
} from '@mui/material';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import config from '../../config/config';

const ROLES = {
    ADMIN: 'admin',
    STAFF: 'staff',
};

function UserDialog({ open, onClose, user }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: ROLES.STAFF,
    });
    const [errors, setErrors] = useState({});
    const { showSuccess, showError } = useNotification();
    const { getToken } = useAuth();

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                role: ROLES.STAFF,
            });
        }
        setErrors({});
    }, [user]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!user && !formData.password) newErrors.password = 'Password is required';
        if (!formData.role) newErrors.role = 'Role is required';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Username validation
        if (formData.username && (formData.username.length < 3 || formData.username.length > 20)) {
            newErrors.username = 'Username must be between 3 and 20 characters';
        }

        // Password validation (for new users or password changes)
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const url = user
                ? `${config.API_URL}/api/users/${user._id}`
                : `${config.API_URL}/api/users`;
            
            const method = user ? 'PUT' : 'POST';
            const body = { ...formData };
            if (!body.password) delete body.password;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save user');
            }

            showSuccess(`User ${user ? 'updated' : 'created'} successfully`);
            onClose(true);
        } catch (error) {
            showError(error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        name="username"
                        label="Username"
                        value={formData.username}
                        onChange={handleChange}
                        error={!!errors.username}
                        helperText={errors.username}
                        fullWidth
                    />

                    <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                    />

                    <TextField
                        name="password"
                        label={user ? "New Password (leave blank to keep current)" : "Password"}
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        fullWidth
                    />

                    <FormControl error={!!errors.role} fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            label="Role"
                        >
                            <MenuItem value={ROLES.ADMIN}>Admin</MenuItem>
                            <MenuItem value={ROLES.STAFF}>Staff</MenuItem>
                        </Select>
                        {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {user ? 'Save Changes' : 'Create User'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDialog;
