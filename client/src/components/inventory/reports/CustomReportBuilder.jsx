import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as RunIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useReport } from '../../../context/ReportContext';

const availableFields = [
  { id: 'sku', label: 'SKU', category: 'Product' },
  { id: 'name', label: 'Product Name', category: 'Product' },
  { id: 'category', label: 'Category', category: 'Product' },
  { id: 'currentStock', label: 'Current Stock', category: 'Inventory' },
  { id: 'reorderPoint', label: 'Reorder Point', category: 'Inventory' },
  { id: 'value', label: 'Value', category: 'Inventory' },
  { id: 'supplier', label: 'Supplier', category: 'Supplier' },
  { id: 'lastOrder', label: 'Last Order Date', category: 'Orders' },
  { id: 'lastReceived', label: 'Last Received Date', category: 'Orders' },
];

const filterOperators = {
  string: ['equals', 'contains', 'starts with', 'ends with'],
  number: ['equals', 'greater than', 'less than', 'between'],
  date: ['equals', 'after', 'before', 'between'],
};

const CustomReportBuilder = () => {
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showTotals, setShowTotals] = useState(false);
  const [groupBy, setGroupBy] = useState('');
  const [previewData, setPreviewData] = useState([]);

  const { generateCustomReport, saveCustomReport } = useReport();

  const handleAddField = (field) => {
    setSelectedFields((prev) => [...prev, field]);
  };

  const handleRemoveField = (fieldId) => {
    setSelectedFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleAddFilter = () => {
    setFilters((prev) => [
      ...prev,
      { field: '', operator: '', value: '', enabled: true },
    ]);
  };

  const handleUpdateFilter = (index, field, value) => {
    setFilters((prev) => {
      const newFilters = [...prev];
      newFilters[index] = { ...newFilters[index], [field]: value };
      return newFilters;
    });
  };

  const handleRemoveFilter = (index) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    const reportConfig = {
      name: reportName,
      fields: selectedFields,
      filters,
      sortBy,
      sortDirection,
      showTotals,
      groupBy,
    };

    try {
      const data = await generateCustomReport(reportConfig);
      setPreviewData(data);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const handleSave = async () => {
    const reportConfig = {
      name: reportName,
      fields: selectedFields,
      filters,
      sortBy,
      sortDirection,
      showTotals,
      groupBy,
    };

    try {
      await saveCustomReport(reportConfig);
      // Show success message
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const handleExport = (format) => {
    // TODO: Implement export functionality
    console.log(`Exporting in ${format} format`);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Configuration
            </Typography>
            
            {/* Report Name */}
            <TextField
              fullWidth
              label="Report Name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Field Selection */}
            <Typography variant="subtitle2" gutterBottom>
              Available Fields
            </Typography>
            <List dense>
              {availableFields.map((field) => (
                <ListItem key={field.id}>
                  <ListItemText
                    primary={field.label}
                    secondary={field.category}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleAddField(field)}
                      disabled={selectedFields.some((f) => f.id === field.id)}
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Report Design */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Design
            </Typography>

            {/* Selected Fields */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Fields
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedFields.map((field) => (
                  <Chip
                    key={field.id}
                    label={field.label}
                    onDelete={() => handleRemoveField(field.id)}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Filters */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Filters
              </Typography>
              {filters.map((filter, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <TextField
                      select
                      fullWidth
                      label="Field"
                      value={filter.field}
                      onChange={(e) =>
                        handleUpdateFilter(index, 'field', e.target.value)
                      }
                    >
                      {selectedFields.map((field) => (
                        <MenuItem key={field.id} value={field.id}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      select
                      fullWidth
                      label="Operator"
                      value={filter.operator}
                      onChange={(e) =>
                        handleUpdateFilter(index, 'operator', e.target.value)
                      }
                    >
                      {filter.field &&
                        filterOperators[
                          typeof availableFields.find((f) => f.id === filter.field)
                            ?.value
                        ]?.map((op) => (
                          <MenuItem key={op} value={op}>
                            {op}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Value"
                      value={filter.value}
                      onChange={(e) =>
                        handleUpdateFilter(index, 'value', e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveFilter(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddFilter}
                variant="outlined"
              >
                Add Filter
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Sorting and Grouping */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {selectedFields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Sort Direction"
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Options */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showTotals}
                    onChange={(e) => setShowTotals(e.target.checked)}
                  />
                }
                label="Show Totals"
              />
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<RunIcon />}
                onClick={handlePreview}
              >
                Preview
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => handleExport('excel')}
              >
                Export Excel
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomReportBuilder;
