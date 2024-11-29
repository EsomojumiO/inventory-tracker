import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  IconButton,
  TextField,
  Chip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const CustomerDetails = ({ customer, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editedData, setEditedData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    businessName: customer?.businessName || '',
    category: customer?.category || 'regular',
    address: customer?.address || {
      street: '',
      city: '',
      state: '',
      country: ''
    },
    notes: customer?.notes || []
  });
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  
  const { token } = useAuth();
  const { showSuccess, showError } = useNotification();

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/customers/${customer._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) throw new Error('Failed to update customer');

      showSuccess('Customer updated successfully');
      setEditing(false);
      onUpdate();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleAddNote = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/customers/${customer._id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newNote })
      });

      if (!response.ok) throw new Error('Failed to add note');

      showSuccess('Note added successfully');
      setAddNoteOpen(false);
      setNewNote('');
      onUpdate();
    } catch (error) {
      showError(error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Customer Profile
        </Typography>
        <Box>
          {editing ? (
            <>
              <IconButton onClick={handleSave} color="primary">
                <SaveIcon />
              </IconButton>
              <IconButton onClick={() => setEditing(false)} color="error">
                <CancelIcon />
              </IconButton>
            </>
          ) : (
            <IconButton onClick={() => setEditing(true)} color="primary">
              <EditIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: customer?.category === 'vip' ? 'primary.main' : 'secondary.main'
                }}
              >
                {(customer?.firstName?.[0] || '') + (customer?.lastName?.[0] || '')}
              </Avatar>
              <Box ml={2}>
                {editing ? (
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={editedData.firstName}
                        onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={editedData.lastName}
                        onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="h6">
                      {customer?.firstName || ''} {customer?.lastName || ''}
                    </Typography>
                    {customer?.businessName && (
                      <Typography variant="body2" color="textSecondary">
                        {customer.businessName}
                      </Typography>
                    )}
                  </>
                )}
                <Chip
                  label={customer?.category || 'regular'}
                  size="small"
                  color={customer?.category === 'vip' ? 'primary' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={
                    editing ? (
                      <TextField
                        fullWidth
                        value={editedData.email}
                        onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                      />
                    ) : (
                      customer?.email || ''
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <EmailIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Phone"
                  secondary={
                    editing ? (
                      <TextField
                        fullWidth
                        value={editedData.phone}
                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      />
                    ) : (
                      customer?.phone || ''
                    )
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <PhoneIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Financial Summary */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Financial Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Spent
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(customer?.totalSpent || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h6">
                      {customer?.totalPurchases || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Credit Limit
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(customer?.creditLimit || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Loyalty Points
                    </Typography>
                    <Typography variant="h6">
                      {customer?.loyaltyPoints || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Notes and Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Notes & Activity
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setAddNoteOpen(true)}
              >
                Add Note
              </Button>
            </Box>
            <List>
              {customer?.notes?.map((note, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={note.content}
                    secondary={formatDate(note.createdAt)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Note Dialog */}
      <Dialog open={addNoteOpen} onClose={() => setAddNoteOpen(false)}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNoteOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetails;
