import React, { useState, useEffect } from 'react';
import { Box, IconButton, Badge, Drawer, List, ListItem, ListItemText, ListItemSecondaryAction, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import './NotificationCenter.css';

const NotificationCenter = ({ items = [], onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => {
    if (!Array.isArray(items)) {
      setNotifications([]);
      return;
    }

    // Generate notifications based on items
    const newNotifications = items.reduce((acc, item) => {
      if (!item) return acc;
      
      if (item.quantity === 0) {
        acc.push({
          id: `out-${item._id || Date.now()}`,
          type: 'out-of-stock',
          item: item,
          message: `${item.name} is out of stock!`,
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      } else if (item.quantity < LOW_STOCK_THRESHOLD) {
        acc.push({
          id: `low-${item._id || Date.now()}`,
          type: 'low-stock',
          item: item,
          message: `${item.name} is running low (${item.quantity} left)`,
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      }
      return acc;
    }, []);

    setNotifications(newNotifications);
  }, [items]);

  const handleDismiss = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    if (onDismiss) {
      onDismiss(notificationId);
    }
  };

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <Box>
      <IconButton 
        color="inherit" 
        onClick={toggleDrawer}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{
            width: 350,
            p: 2,
            height: '100%',
            backgroundColor: '#f8f9fa'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Notifications ({notifications.length})
            </Typography>
            <IconButton onClick={toggleDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <List>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No notifications"
                  secondary="You're all caught up!"
                />
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    mb: 1,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    borderLeft: `4px solid ${getSeverityColor(notification.severity)}`
                  }}
                >
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString()}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default NotificationCenter;
