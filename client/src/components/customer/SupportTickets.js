import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Chip,
  Divider,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general',
  });
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/customers/${user.id}/support-tickets`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTicket,
          customerId: user.id,
        }),
      });
      const data = await response.json();
      setTickets([...tickets, data]);
      setDialogOpen(false);
      setNewTicket({
        subject: '',
        message: '',
        priority: 'medium',
        category: 'general',
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleReply = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          customerId: user.id,
        }),
      });
      const data = await response.json();
      
      // Update the selected ticket with the new message
      setSelectedTicket({
        ...selectedTicket,
        messages: [...selectedTicket.messages, data],
      });
      
      // Update the tickets list
      setTickets(tickets.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, messages: [...ticket.messages, data] }
          : ticket
      ));
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Support Tickets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Ticket
        </Button>
      </Box>

      <List>
        {tickets.map((ticket) => (
          <Paper key={ticket.id} sx={{ mb: 2 }}>
            <ListItem
              button
              onClick={() => setSelectedTicket(ticket)}
              sx={{ display: 'block' }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  {ticket.subject}
                </Typography>
                <Box>
                  <Chip
                    label={ticket.status}
                    size="small"
                    sx={{ mr: 1 }}
                    color={ticket.status === 'open' ? 'primary' : 'default'}
                  />
                  <Chip
                    label={ticket.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(ticket.priority),
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {format(new Date(ticket.createdAt), 'PPp')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Category: {ticket.category}
              </Typography>
            </ListItem>
          </Paper>
        ))}
      </List>

      {/* New Ticket Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Support Ticket</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject"
            fullWidth
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Message"
            fullWidth
            multiline
            rows={4}
            value={newTicket.message}
            onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              label="Category"
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="technical">Technical</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuItem value="shipping">Shipping</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTicket} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog
        open={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedTicket && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedTicket.subject}</Typography>
                <Box>
                  <Chip
                    label={selectedTicket.status}
                    size="small"
                    sx={{ mr: 1 }}
                    color={selectedTicket.status === 'open' ? 'primary' : 'default'}
                  />
                  <Chip
                    label={selectedTicket.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(selectedTicket.priority),
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Created: {format(new Date(selectedTicket.createdAt), 'PPp')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Category: {selectedTicket.category}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List>
                {selectedTicket.messages.map((message, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          color={message.isStaff ? 'primary' : 'textPrimary'}
                        >
                          {message.isStaff ? 'Support Staff' : 'You'}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                          >
                            {message.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="textSecondary"
                            display="block"
                          >
                            {format(new Date(message.createdAt), 'PPp')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              {selectedTicket.status === 'open' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Reply"
                    multiline
                    rows={3}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleReply}
                      disabled={!newMessage.trim()}
                    >
                      Send Reply
                    </Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedTicket(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SupportTickets;
