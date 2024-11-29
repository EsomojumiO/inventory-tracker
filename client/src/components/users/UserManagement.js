import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    TablePagination,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import UserDialog from './UserDialog';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import config from '../../config/config';

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const { showSuccess, showError } = useNotification();
    const { user: currentUser, getToken } = useAuth();

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${config.API_URL}/api/users`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            showError('Error fetching users');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(`${config.API_URL}/api/users/${selectedUser._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete user');
            }

            showSuccess('User deleted successfully');
            fetchUsers();
        } catch (error) {
            showError(error.message);
        } finally {
            setDeleteDialogOpen(false);
            setSelectedUser(null);
        }
    };

    const handleDialogClose = (refreshData) => {
        setDialogOpen(false);
        setSelectedUser(null);
        if (refreshData) {
            fetchUsers();
        }
    };

    const displayedUsers = users.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddUser}
                >
                    Add User
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedUsers.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Edit user">
                                        <IconButton
                                            onClick={() => handleEditUser(user)}
                                            disabled={user._id === currentUser._id}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete user">
                                        <IconButton
                                            onClick={() => handleDeleteClick(user)}
                                            disabled={user._id === currentUser._id}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={users.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
            />

            <UserDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                user={selectedUser}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                content={`Are you sure you want to delete the user "${selectedUser?.username}"?`}
            />
        </Box>
    );
}

export default UserManagement;
