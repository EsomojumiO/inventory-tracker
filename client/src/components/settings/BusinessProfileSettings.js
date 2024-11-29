import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    CircularProgress
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import config from '../../config/config';

const Settings = () => {
    const { getToken } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        businessName: '',
        contactDetails: {
            email: '',
            phone: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            }
        },
        logo: { url: '' }
    });
    const [logoPreview, setLogoPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${config.API_URL}/api/settings/business-profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch business profile');
            }

            const data = await response.json();
            if (data.profile) {
                setProfile(data.profile);
                if (data.profile.logo?.url) {
                    setLogoPreview(`${config.API_URL}${data.profile.logo.url}`);
                }
            }
        } catch (error) {
            showError('Error loading profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showError('File size should not exceed 5MB');
                return;
            }
            
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showError('Only JPEG and PNG files are allowed');
                return;
            }

            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setLoading(true);
            const token = getToken();
            const formData = new FormData();
            
            formData.append('businessName', profile.businessName);
            formData.append('email', profile.contactDetails.email);
            formData.append('phone', profile.contactDetails.phone);
            formData.append('address', JSON.stringify(profile.contactDetails.address));
            
            if (event.target.logo.files[0]) {
                formData.append('logo', event.target.logo.files[0]);
            }

            const response = await fetch(`${config.API_URL}/api/settings/business-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update business profile');
            }

            showSuccess('Business profile updated successfully');
        } catch (error) {
            showError('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (event, section = null) => {
        const { name, value } = event.target;
        
        if (section === 'address') {
            setProfile(prev => ({
                ...prev,
                contactDetails: {
                    ...prev.contactDetails,
                    address: {
                        ...prev.contactDetails.address,
                        [name]: value
                    }
                }
            }));
        } else if (section === 'contact') {
            setProfile(prev => ({
                ...prev,
                contactDetails: {
                    ...prev.contactDetails,
                    [name]: value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    if (loading && !profile.businessName) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Business Profile
            </Typography>
            
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Logo Upload */}
                    <Grid item xs={12}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                                src={logoPreview}
                                sx={{ width: 100, height: 100 }}
                            />
                            <label htmlFor="logo-upload">
                                <input
                                    accept="image/*"
                                    id="logo-upload"
                                    name="logo"
                                    type="file"
                                    hidden
                                    onChange={handleLogoChange}
                                />
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<PhotoCamera />}
                                >
                                    Upload Logo
                                </Button>
                            </label>
                        </Box>
                    </Grid>

                    {/* Business Name */}
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            label="Business Name"
                            name="businessName"
                            value={profile.businessName}
                            onChange={handleInputChange}
                        />
                    </Grid>

                    {/* Contact Details */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={profile.contactDetails.email}
                            onChange={(e) => handleInputChange(e, 'contact')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={profile.contactDetails.phone}
                            onChange={(e) => handleInputChange(e, 'contact')}
                        />
                    </Grid>

                    {/* Address */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Address
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            name="street"
                            value={profile.contactDetails.address.street}
                            onChange={(e) => handleInputChange(e, 'address')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="City"
                            name="city"
                            value={profile.contactDetails.address.city}
                            onChange={(e) => handleInputChange(e, 'address')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="State/Province"
                            name="state"
                            value={profile.contactDetails.address.state}
                            onChange={(e) => handleInputChange(e, 'address')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="ZIP/Postal Code"
                            name="zipCode"
                            value={profile.contactDetails.address.zipCode}
                            onChange={(e) => handleInputChange(e, 'address')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            name="country"
                            value={profile.contactDetails.address.country}
                            onChange={(e) => handleInputChange(e, 'address')}
                        />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default Settings;
