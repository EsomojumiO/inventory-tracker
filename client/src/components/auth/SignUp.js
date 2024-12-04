import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box, 
  Paper,
  InputAdornment,
  IconButton,
  LinearProgress,
  Divider,
  Grid
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Google as GoogleIcon,
  Apple as AppleIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import LoadingSpinner from '../LoadingSpinner';
import useForm from '../../hooks/useForm';
import logo from '../../assets/logo.svg';
import config from '../../config';

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    businessName: '',
    username: '',
    password: '',
    confirmPassword: ''
  };

  const validate = (values) => {
    const errors = {};
    
    // First Name validation
    if (!values.firstName) {
      errors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s]{2,30}$/.test(values.firstName)) {
      errors.firstName = 'First name must be 2-30 characters and contain only letters';
    }
    
    // Last Name validation
    if (!values.lastName) {
      errors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s]{2,30}$/.test(values.lastName)) {
      errors.lastName = 'Last name must be 2-30 characters and contain only letters';
    }
    
    // Email validation
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = 'Invalid email address';
    }
    
    // Phone validation with international format support
    if (!values.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(values.phone)) {
      errors.phone = 'Please enter a valid phone number (minimum 10 digits)';
    }
    
    // Business Name validation
    if (!values.businessName) {
      errors.businessName = 'Business name is required';
    } else if (values.businessName.length < 2 || values.businessName.length > 100) {
      errors.businessName = 'Business name must be between 2 and 100 characters';
    }
    
    // Username validation
    if (!values.username) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(values.username)) {
      errors.username = 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!values.password) {
      errors.password = 'Password is required';
    } else {
      if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!/[A-Z]/.test(values.password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      }
      if (!/[a-z]/.test(values.password)) {
        errors.password = 'Password must contain at least one lowercase letter';
      }
      if (!/[0-9]/.test(values.password)) {
        errors.password = 'Password must contain at least one number';
      }
    }
    
    // Confirm Password validation
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await register(values);
      
      if (result.success) {
        showSuccess('Account created successfully! Please log in.');
        navigate('/login');
      } else {
        showError(result.error || 'Failed to create account');
      }
    } catch (error) {
      showError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    try {
      setLoading(true);
      window.location.href = `${config.apiUrl}/auth/${provider.toLowerCase()}`;
    } catch (error) {
      showError(`Failed to login with ${provider}`);
      setLoading(false);
    }
  };

  const { values, errors, touched, handleChange, handleBlur, isSubmitting, handleSubmit: submitForm } = useForm({
    initialValues,
    validate,
    onSubmit: handleSubmit
  });

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.match(/[a-z]+/)) strength += 20;
    if (password.match(/[A-Z]+/)) strength += 20;
    if (password.match(/[0-9]+/)) strength += 20;
    if (password.match(/[$@#&!]+/)) strength += 20;
    return strength;
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: '16px'
          }}
        >
          <Box 
            sx={{ 
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4
            }}
          >
            <img 
              src={logo} 
              alt="RETAIL MASTER" 
              style={{ 
                maxWidth: '240px',
                width: '100%',
                height: 'auto',
                margin: '0 auto'
              }} 
            />
          </Box>
          <Typography component="h1" variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Create Your Account
          </Typography>

          <Box component="form" onSubmit={submitForm} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.firstName && Boolean(errors.firstName)}
                  helperText={touched.firstName && errors.firstName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.lastName && Boolean(errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone Number"
                  value={values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.phone && Boolean(errors.phone)}
                  helperText={touched.phone && errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="businessName"
                  label="Business Name"
                  value={values.businessName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.businessName && Boolean(errors.businessName)}
                  helperText={touched.businessName && errors.businessName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="username"
                  label="Username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={(e) => {
                    handleChange(e);
                    setPasswordStrength(calculatePasswordStrength(e.target.value));
                  }}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {values.password && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={passwordStrength} 
                      color={
                        passwordStrength <= 20 ? 'error' :
                        passwordStrength <= 40 ? 'warning' :
                        passwordStrength <= 60 ? 'info' :
                        'success'
                      }
                    />
                    <Typography variant="caption" color="textSecondary">
                      Password Strength: {passwordStrength}%
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                borderRadius: '12px',
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }}
              disabled={loading || isSubmitting}
            >
              {loading ? <LoadingSpinner size={24} /> : 'Create Account'}
            </Button>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Divider>
                <Typography variant="body2" color="text.secondary">
                  Or sign up with
                </Typography>
              </Divider>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleSocialLogin('Google')}
                  disabled={loading}
                >
                  Google
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AppleIcon />}
                  onClick={() => handleSocialLogin('Apple')}
                  disabled={loading}
                >
                  Apple
                </Button>
              </Grid>
            </Grid>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign in
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignUp;
