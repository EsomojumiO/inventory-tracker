import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    Grid,
    MenuItem,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency } from '../../utils/formatters';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const reportTypes = [
    { value: 'INCOME_STATEMENT', label: 'Income Statement' },
    { value: 'BALANCE_SHEET', label: 'Balance Sheet' },
    { value: 'CASH_FLOW', label: 'Cash Flow Statement' }
];

const FinancialReports = () => {
    const { generateFinancialReport } = useAccounting();
    const [reportType, setReportType] = useState('INCOME_STATEMENT');
    const [startDate, setStartDate] = useState(dayjs().startOf('year'));
    const [endDate, setEndDate] = useState(dayjs());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            const data = await generateFinancialReport(reportType, startDate, endDate);
            setReport(data);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!report) return;

        let worksheetData = [];

        // Format data based on report type
        switch (reportType) {
            case 'INCOME_STATEMENT':
                worksheetData = [
                    ['Income Statement'],
                    [`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
                    [''],
                    ['Revenue'],
                    ...Object.entries(report.revenue).map(([name, amount]) => [name, amount]),
                    [''],
                    ['Expenses'],
                    ...Object.entries(report.expenses).map(([name, amount]) => [name, amount]),
                    [''],
                    ['Net Income', report.netIncome]
                ];
                break;

            case 'BALANCE_SHEET':
                worksheetData = [
                    ['Balance Sheet'],
                    [`As of ${endDate.toLocaleDateString()}`],
                    [''],
                    ['Assets'],
                    ...Object.entries(report.assets).map(([name, amount]) => [name, amount]),
                    ['Total Assets', report.totalAssets],
                    [''],
                    ['Liabilities'],
                    ...Object.entries(report.liabilities).map(([name, amount]) => [name, amount]),
                    ['Total Liabilities', report.totalLiabilities],
                    [''],
                    ['Equity'],
                    ...Object.entries(report.equity).map(([name, amount]) => [name, amount]),
                    ['Total Equity', report.totalEquity]
                ];
                break;

            case 'CASH_FLOW':
                worksheetData = [
                    ['Cash Flow Statement'],
                    [`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
                    [''],
                    ['Operating Activities'],
                    ...Object.entries(report.operatingActivities).map(([name, amount]) => [name, amount]),
                    [''],
                    ['Investing Activities'],
                    ...Object.entries(report.investingActivities).map(([name, amount]) => [name, amount]),
                    [''],
                    ['Financing Activities'],
                    ...Object.entries(report.financingActivities).map(([name, amount]) => [name, amount]),
                    [''],
                    ['Net Cash Flow', report.netCashFlow]
                ];
                break;
        }

        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${reportType.toLowerCase()}_${new Date().toISOString()}.xlsx`);
    };

    const renderIncomeStatement = () => {
        if (!report) return null;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Revenue</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.revenue).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Expenses</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.expenses).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Typography variant="h6">Net Income</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="h6">
                                    {formatCurrency(report.netIncome)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderBalanceSheet = () => {
        if (!report) return null;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Assets</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.assets).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>Total Assets</TableCell>
                            <TableCell align="right">{formatCurrency(report.totalAssets)}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Liabilities</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.liabilities).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>Total Liabilities</TableCell>
                            <TableCell align="right">{formatCurrency(report.totalLiabilities)}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Equity</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.equity).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>Total Equity</TableCell>
                            <TableCell align="right">{formatCurrency(report.totalEquity)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderCashFlow = () => {
        if (!report) return null;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Operating Activities</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.operatingActivities).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}

                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Investing Activities</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.investingActivities).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}

                        <TableRow>
                            <TableCell colSpan={2}>
                                <Typography variant="h6">Financing Activities</Typography>
                            </TableCell>
                        </TableRow>
                        {Object.entries(report.financingActivities).map(([name, amount]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        ))}

                        <TableRow>
                            <TableCell>
                                <Typography variant="h6">Net Cash Flow</Typography>
                            </TableCell>
                            <TableCell align="right">
                                <Typography variant="h6">
                                    {formatCurrency(report.netCashFlow)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box>
            <Card sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Report Type"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            {reportTypes.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={setStartDate}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={setEndDate}
                            slotProps={{ textField: { fullWidth: true } }}
                            minDate={startDate}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleGenerateReport}
                                disabled={loading}
                            >
                                Generate Report
                            </Button>
                            {report && (
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportToExcel}
                                >
                                    Export
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {report && (
                <Card sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        {reportTypes.find(t => t.value === reportType)?.label}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        {reportType === 'BALANCE_SHEET'
                            ? `As of ${endDate.toLocaleDateString()}`
                            : `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                        {reportType === 'INCOME_STATEMENT' && renderIncomeStatement()}
                        {reportType === 'BALANCE_SHEET' && renderBalanceSheet()}
                        {reportType === 'CASH_FLOW' && renderCashFlow()}
                    </Box>
                </Card>
            )}
        </Box>
    );
};

export default FinancialReports;
