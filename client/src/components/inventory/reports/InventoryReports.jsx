import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Schedule as ScheduleIcon,
  Settings as CustomizeIcon,
} from '@mui/icons-material';
import { useReport } from '../../../context/ReportContext';
import ReportsDashboard from './ReportsDashboard';
import StockLevelsReport from './StockLevelsReport';
import StockMovementReport from './StockMovementReport';
import ReorderAnalysisReport from './ReorderAnalysisReport';
import ScheduledReports from './ScheduledReports';
import CustomReportBuilder from './CustomReportBuilder';

const InventoryReports = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <ReportsDashboard />;
      case 1:
        return <StockLevelsReport />;
      case 2:
        return <StockMovementReport />;
      case 3:
        return <ReorderAnalysisReport />;
      case 4:
        return <ScheduledReports />;
      case 5:
        return <CustomReportBuilder />;
      default:
        return <ReportsDashboard />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory Reports
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ScheduleIcon />}
            onClick={() => setCurrentTab(4)}
            sx={{ mr: 2 }}
          >
            Schedule Reports
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CustomizeIcon />}
            onClick={() => setCurrentTab(5)}
          >
            Custom Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab
                icon={<ReportIcon />}
                label="Dashboard"
                iconPosition="start"
              />
              <Tab
                icon={<ReportIcon />}
                label="Stock Levels"
                iconPosition="start"
              />
              <Tab
                icon={<ReportIcon />}
                label="Stock Movement"
                iconPosition="start"
              />
              <Tab
                icon={<ReportIcon />}
                label="Reorder Analysis"
                iconPosition="start"
              />
              <Tab
                icon={<ScheduleIcon />}
                label="Scheduled Reports"
                iconPosition="start"
              />
              <Tab
                icon={<CustomizeIcon />}
                label="Custom Report"
                iconPosition="start"
              />
            </Tabs>
            {renderTabContent()}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InventoryReports;
