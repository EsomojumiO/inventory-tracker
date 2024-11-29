import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import Settings from './BusinessProfileSettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const SettingsPage = () => {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange}>
                    <Tab label="General" />
                    <Tab label="Security" />
                    <Tab label="Notifications" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <Settings />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SecuritySettings />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <NotificationSettings />
            </TabPanel>
        </Box>
    );
};

export default SettingsPage;
