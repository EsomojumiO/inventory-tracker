import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemText,
  Popover,
  Divider,
} from '@mui/material';
import { 
  AccountCircle, 
  Brightness4, 
  Brightness7, 
  Notifications,
  PointOfSale,
  Payment 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const Header = ({ toggleColorMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [posAnchorEl, setPosAnchorEl] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Sample notifications - in a real app, these would come from your backend
  const [notifications] = useState([
    {
      id: 1,
      message: 'Low stock alert: Product XYZ',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    {
      id: 2,
      message: 'New order received #12345',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      id: 3,
      message: 'Payment received from Customer ABC',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
  ]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePosMenu = (event) => {
    setPosAnchorEl(event.currentTarget);
  };

  const handlePosClose = () => {
    setPosAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const navigateHome = () => {
    navigate('/');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        {/* Logo and Home Link */}
        <Box 
          onClick={navigateHome}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            mr: 4
          }}
        >
          <Avatar
            src="/logo.png"
            alt="Logo"
            sx={{ 
              width: 40, 
              height: 40,
              mr: 1,
              '&:hover': {
                opacity: 0.8
              }
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            Retail Master
          </Typography>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button color="inherit" onClick={() => navigate('/inventory')}>
            Inventory
          </Button>
          <Button color="inherit" onClick={() => navigate('/suppliers')}>
            Suppliers
          </Button>
          <Button color="inherit" onClick={() => navigate('/sales')}>
            Sales
          </Button>
          <Button color="inherit" onClick={() => navigate('/documents')}>
            Documents
          </Button>
          
          {/* POS Menu Button */}
          <Button
            color="inherit"
            onClick={handlePosMenu}
            startIcon={<PointOfSale />}
            sx={{
              backgroundColor: location.pathname.startsWith('/pos') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            POS
          </Button>
          <Menu
            anchorEl={posAnchorEl}
            open={Boolean(posAnchorEl)}
            onClose={handlePosClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem 
              onClick={() => {
                navigate('/pos/sales-terminal');
                handlePosClose();
              }}
            >
              <PointOfSale sx={{ mr: 1 }} />
              Sales Terminal
            </MenuItem>
            <MenuItem 
              onClick={() => {
                navigate('/pos/payment');
                handlePosClose();
              }}
            >
              <Payment sx={{ mr: 1 }} />
              Payments
            </MenuItem>
          </Menu>
        </Box>

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={handleNotificationClick}
          sx={{ mr: 2 }}
        >
          <Badge badgeContent={notifications.length} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        <Popover
          open={Boolean(notificationAnchorEl)}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <List sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem>
                    <ListItemText
                      primary={notification.message}
                      secondary={formatTimestamp(notification.timestamp)}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No new notifications" />
              </ListItem>
            )}
          </List>
        </Popover>

        {/* Theme Toggle */}
        <IconButton
          sx={{ mr: 2 }}
          onClick={toggleColorMode}
          color="inherit"
        >
          {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* User Menu */}
        <div>
          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleProfile}>Profile</MenuItem>
            <MenuItem onClick={handleSettings}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
