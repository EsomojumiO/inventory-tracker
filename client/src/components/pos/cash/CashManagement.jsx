import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    TextField,
    Box,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    AccountBalance as AccountBalanceIcon,
    CompareArrows as CompareArrowsIcon,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCash, CASH_TRANSACTION_TYPES } from '../../../context/CashContext';
import { useAuth } from '../../../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CashManagement = () => {
    const { user } = useAuth();
    const {
        currentBalance,
        lastReconciliation,
        addTransaction,
        reconcileCash,
        getCashSummary,
        getTransactionsByDateRange,
        formatAmount,
    } = useCash();

    const [selectedTab, setSelectedTab] = useState(0);
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [isReconciliationDialogOpen, setIsReconciliationDialogOpen] = useState(false);
    const [transactionType, setTransactionType] = useState(CASH_TRANSACTION_TYPES.PAYMENT);
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [actualCashCount, setActualCashCount] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [cashSummary, setCashSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const summary = getCashSummary(startDate, endDate);
        const transactionList = getTransactionsByDateRange(startDate, endDate);
        setCashSummary(summary);
        setTransactions(transactionList);
    }, [startDate, endDate, getCashSummary, getTransactionsByDateRange]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleAddTransaction = () => {
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            addTransaction({
                type: transactionType,
                amount: Number(amount),
                notes,
            });
            setIsTransactionDialogOpen(false);
            resetForm();
        } catch (error) {
            setError('Failed to add transaction');
        }
    };

    const handleReconciliation = () => {
        if (!actualCashCount || isNaN(actualCashCount)) {
            setError('Please enter a valid cash count');
            return;
        }

        try {
            reconcileCash(Number(actualCashCount), notes);
            setIsReconciliationDialogOpen(false);
            resetForm();
        } catch (error) {
            setError('Failed to reconcile cash');
        }
    };

    const resetForm = () => {
        setAmount('');
        setNotes('');
        setActualCashCount('');
        setError('');
    };

    const getChartData = () => {
        if (!cashSummary) return [];

        return [
            { name: 'Received', amount: cashSummary.totalReceived },
            { name: 'Refunded', amount: cashSummary.totalRefunded },
            { name: 'Withdrawn', amount: cashSummary.totalWithdrawn },
            { name: 'Adjustments +', amount: cashSummary.totalAdjustmentsPositive },
            { name: 'Adjustments -', amount: cashSummary.totalAdjustmentsNegative },
        ];
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Cash Summary Cards */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                            Current Balance
                        </Typography>
                        <Typography variant="h4" color="primary">
                            {formatAmount(currentBalance)}
                        </Typography>
                        {lastReconciliation && (
                            <Typography variant="body2" color="text.secondary">
                                Last reconciled: {new Date(lastReconciliation.timestamp).toLocaleString()}
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setIsTransactionDialogOpen(true)}
                            >
                                Add Transaction
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CompareArrowsIcon />}
                                onClick={() => setIsReconciliationDialogOpen(true)}
                            >
                                Reconcile Cash
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Main Content */}
                <Grid item xs={12}>
                    <Paper sx={{ width: '100%' }}>
                        <Tabs value={selectedTab} onChange={handleTabChange}>
                            <Tab label="Transactions" />
                            <Tab label="Summary" />
                            <Tab label="Analytics" />
                        </Tabs>

                        {/* Transactions Tab */}
                        {selectedTab === 0 && (
                            <Box sx={{ p: 2 }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>User</TableCell>
                                                <TableCell>Notes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.map((transaction) => (
                                                <TableRow key={transaction.id}>
                                                    <TableCell>
                                                        {new Date(transaction.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{transaction.type}</TableCell>
                                                    <TableCell>{formatAmount(transaction.amount)}</TableCell>
                                                    <TableCell>{transaction.userName}</TableCell>
                                                    <TableCell>{transaction.notes}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* Summary Tab */}
                        {selectedTab === 1 && cashSummary && (
                            <Box sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="h6">Total Received</Typography>
                                            <Typography variant="h4" color="success.main">
                                                {formatAmount(cashSummary.totalReceived)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="h6">Total Refunded</Typography>
                                            <Typography variant="h4" color="error.main">
                                                {formatAmount(cashSummary.totalRefunded)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="h6">Net Cash Flow</Typography>
                                            <Typography variant="h4" color="primary">
                                                {formatAmount(cashSummary.netCashFlow)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* Analytics Tab */}
                        {selectedTab === 2 && (
                            <Box sx={{ p: 2, height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={getChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatAmount(value)} />
                                        <Legend />
                                        <Bar dataKey="amount" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Add Transaction Dialog */}
            <Dialog
                open={isTransactionDialogOpen}
                onClose={() => setIsTransactionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add Cash Transaction</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Transaction Type</InputLabel>
                        <Select
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                        >
                            <MenuItem value={CASH_TRANSACTION_TYPES.PAYMENT}>Payment</MenuItem>
                            <MenuItem value={CASH_TRANSACTION_TYPES.REFUND}>Refund</MenuItem>
                            <MenuItem value={CASH_TRANSACTION_TYPES.RECEIPT}>Receipt</MenuItem>
                            <MenuItem value={CASH_TRANSACTION_TYPES.WITHDRAWAL}>Withdrawal</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsTransactionDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddTransaction}>
                        Add Transaction
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reconciliation Dialog */}
            <Dialog
                open={isReconciliationDialogOpen}
                onClose={() => setIsReconciliationDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Reconcile Cash</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        System Balance: {formatAmount(currentBalance)}
                    </Typography>
                    <TextField
                        label="Actual Cash Count"
                        type="number"
                        value={actualCashCount}
                        onChange={(e) => setActualCashCount(e.target.value)}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        label="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsReconciliationDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleReconciliation}>
                        Reconcile
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CashManagement;
