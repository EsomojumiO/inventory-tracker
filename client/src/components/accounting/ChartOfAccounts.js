import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency } from '../../utils/formatters';

const accountTypes = [
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' }
];

const accountSubtypes = [
    { value: 'CURRENT', label: 'Current' },
    { value: 'NON_CURRENT', label: 'Non-Current' },
    { value: 'OPERATING', label: 'Operating' },
    { value: 'NON_OPERATING', label: 'Non-Operating' }
];

const AccountDialog = ({ open, onClose, account, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: '',
        subtype: '',
        description: '',
        ...account
    });

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {account ? 'Edit Account' : 'Create Account'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="code"
                                label="Account Code"
                                value={formData.code}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="name"
                                label="Account Name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="type"
                                label="Account Type"
                                value={formData.type}
                                onChange={handleChange}
                                select
                                fullWidth
                                required
                            >
                                {accountTypes.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                name="subtype"
                                label="Account Subtype"
                                value={formData.subtype}
                                onChange={handleChange}
                                select
                                fullWidth
                                required
                            >
                                {accountSubtypes.map(subtype => (
                                    <MenuItem key={subtype.value} value={subtype.value}>
                                        {subtype.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {account ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

const ChartOfAccounts = () => {
    const { accounts, loading, fetchAccounts, createAccount, updateAccount } = useAccounting();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleCreateAccount = async (accountData) => {
        await createAccount(accountData);
        setDialogOpen(false);
    };

    const handleUpdateAccount = async (accountData) => {
        await updateAccount(selectedAccount._id, accountData);
        setSelectedAccount(null);
        setDialogOpen(false);
    };

    const handleEdit = (account) => {
        setSelectedAccount(account);
        setDialogOpen(true);
    };

    const groupedAccounts = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
    }, {});

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h2">
                    Chart of Accounts
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                >
                    New Account
                </Button>
            </Box>

            {Object.entries(groupedAccounts).map(([type, accounts]) => (
                <Card key={type} sx={{ mb: 3 }}>
                    <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
                        <Typography variant="h6">{type}</Typography>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Subtype</TableCell>
                                    <TableCell align="right">Balance</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {accounts.map(account => (
                                    <TableRow key={account._id}>
                                        <TableCell>{account.code}</TableCell>
                                        <TableCell>{account.name}</TableCell>
                                        <TableCell>{account.subtype}</TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(account.balance)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(account)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            ))}

            <AccountDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setSelectedAccount(null);
                }}
                account={selectedAccount}
                onSave={selectedAccount ? handleUpdateAccount : handleCreateAccount}
            />
        </Box>
    );
};

export default ChartOfAccounts;
