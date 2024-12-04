import React, { useState } from 'react';
import {
    Box,
    Tab,
    Tabs,
    Typography,
    Container,
    Paper
} from '@mui/material';
import {
    AccountBalance as AccountBalanceIcon,
    Receipt as ReceiptIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import ChartOfAccounts from './ChartOfAccounts';
import TransactionEntry from './TransactionEntry';
import FinancialReports from './FinancialReports';

function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`accounting-tabpanel-${index}`}
            aria-labelledby={`accounting-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `accounting-tab-${index}`,
        'aria-controls': `accounting-tabpanel-${index}`,
    };
}

const AccountingDashboard = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="xl">
            <Paper sx={{ width: '100%', mt: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="accounting tabs"
                        variant="fullWidth"
                    >
                        <Tab
                            icon={<AccountBalanceIcon />}
                            label="Chart of Accounts"
                            {...a11yProps(0)}
                        />
                        <Tab
                            icon={<ReceiptIcon />}
                            label="Transactions"
                            {...a11yProps(1)}
                        />
                        <Tab
                            icon={<AssessmentIcon />}
                            label="Financial Reports"
                            {...a11yProps(2)}
                        />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <ChartOfAccounts />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <TransactionEntry />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <FinancialReports />
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default AccountingDashboard;
