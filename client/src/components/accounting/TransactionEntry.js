import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    Grid,
    TextField,
    MenuItem,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency } from '../../utils/formatters';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const transactionTypes = [
    { value: 'JOURNAL', label: 'Journal Entry' },
    { value: 'PAYMENT', label: 'Payment' },
    { value: 'RECEIPT', label: 'Receipt' },
    { value: 'SALE', label: 'Sale' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'EXPENSE', label: 'Expense' }
];

const initialEntry = {
    account: '',
    description: '',
    debit: '',
    credit: ''
};

const TransactionEntry = () => {
    const { accounts, createTransaction } = useAccounting();
    const [formData, setFormData] = useState({
        date: dayjs(),
        type: 'JOURNAL',
        reference: '',
        description: '',
        entries: [{ ...initialEntry }, { ...initialEntry }]
    });

    const [totals, setTotals] = useState({ debit: 0, credit: 0 });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const debitTotal = formData.entries.reduce((sum, entry) => 
            sum + (Number(entry.debit) || 0), 0
        );
        const creditTotal = formData.entries.reduce((sum, entry) => 
            sum + (Number(entry.credit) || 0), 0
        );
        setTotals({ debit: debitTotal, credit: creditTotal });
    }, [formData.entries]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handleDateChange = (newValue) => {
        setFormData(prev => ({ ...prev, date: newValue }));
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...formData.entries];
        newEntries[index] = {
            ...newEntries[index],
            [field]: value,
            // Clear the opposite field if entering a value
            ...(field === 'debit' && value ? { credit: '' } : {}),
            ...(field === 'credit' && value ? { debit: '' } : {})
        };
        setFormData(prev => ({ ...prev, entries: newEntries }));
    };

    const addEntry = () => {
        setFormData(prev => ({
            ...prev,
            entries: [...prev.entries, { ...initialEntry }]
        }));
    };

    const removeEntry = (index) => {
        if (formData.entries.length <= 2) return; // Minimum 2 entries required
        const newEntries = formData.entries.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, entries: newEntries }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.reference) newErrors.reference = 'Reference is required';
        if (!formData.type) newErrors.type = 'Type is required';
        if (Math.abs(totals.debit - totals.credit) > 0.01) {
            newErrors.balance = 'Debits and credits must be equal';
        }

        formData.entries.forEach((entry, index) => {
            if (!entry.account) {
                newErrors[`entries.${index}.account`] = 'Account is required';
            }
            if (!entry.debit && !entry.credit) {
                newErrors[`entries.${index}.amount`] = 'Either debit or credit is required';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await createTransaction(formData);
            // Reset form
            setFormData({
                date: dayjs(),
                type: 'JOURNAL',
                reference: '',
                description: '',
                entries: [{ ...initialEntry }, { ...initialEntry }]
            });
        } catch (error) {
            console.error('Error creating transaction:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    New Transaction
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <DatePicker
                            label="Date"
                            value={formData.date}
                            onChange={handleDateChange}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            name="type"
                            label="Transaction Type"
                            value={formData.type}
                            onChange={handleChange}
                            select
                            fullWidth
                            error={!!errors.type}
                            helperText={errors.type}
                        >
                            {transactionTypes.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            name="reference"
                            label="Reference"
                            value={formData.reference}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.reference}
                            helperText={errors.reference}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            name="description"
                            label="Description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Account</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Debit</TableCell>
                                    <TableCell align="right">Credit</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.entries.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <TextField
                                                select
                                                fullWidth
                                                value={entry.account}
                                                onChange={(e) => handleEntryChange(index, 'account', e.target.value)}
                                                error={!!errors[`entries.${index}.account`]}
                                                size="small"
                                            >
                                                {accounts.map(account => (
                                                    <MenuItem key={account._id} value={account._id}>
                                                        {account.code} - {account.name}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                value={entry.description}
                                                onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                value={entry.debit}
                                                onChange={(e) => handleEntryChange(index, 'debit', e.target.value)}
                                                error={!!errors[`entries.${index}.amount`]}
                                                size="small"
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                value={entry.credit}
                                                onChange={(e) => handleEntryChange(index, 'credit', e.target.value)}
                                                error={!!errors[`entries.${index}.amount`]}
                                                size="small"
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => removeEntry(index)}
                                                disabled={formData.entries.length <= 2}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={addEntry}
                                        >
                                            Add Line
                                        </Button>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle1">
                                            {formatCurrency(totals.debit)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="subtitle1">
                                            {formatCurrency(totals.credit)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {errors.balance && (
                        <Typography color="error" sx={{ mt: 1 }}>
                            {errors.balance}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={Math.abs(totals.debit - totals.credit) > 0.01}
                    >
                        Create Transaction
                    </Button>
                </Box>
            </Card>
        </form>
    );
};

export default TransactionEntry;
