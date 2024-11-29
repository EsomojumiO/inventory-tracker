import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Collapse,
  Alert,
  useTheme,
  Tabs,
  Tab,
  ColorPicker,
} from '@mui/material';
import { SketchPicker } from 'react-color';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import RestoreIcon from '@mui/icons-material/Restore';
import { useThemeContext } from '../../context/ThemeContext';

const ThemeCustomizer = () => {
  const theme = useTheme();
  const { updateTheme, resetTheme } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [themeSettings, setThemeSettings] = useState({
    colors: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      background: theme.palette.background.default,
      surface: theme.palette.background.paper,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      success: theme.palette.success.main,
      text: theme.palette.text.primary,
    },
    typography: {
      fontSize: theme.typography.fontSize,
      fontFamily: theme.typography.fontFamily,
      h1: {
        fontSize: theme.typography.h1.fontSize,
        fontWeight: theme.typography.h1.fontWeight,
      },
      body1: {
        fontSize: theme.typography.body1.fontSize,
        lineHeight: theme.typography.body1.lineHeight,
      },
    },
    spacing: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    shadows: theme.shadows[1],
  });

  const [selectedColor, setSelectedColor] = useState({
    key: 'primary',
    value: themeSettings.colors.primary,
  });

  const handleColorChange = (color) => {
    setThemeSettings((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [selectedColor.key]: color.hex,
      },
    }));
  };

  const handleTypographyChange = (property, value) => {
    setThemeSettings((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [property]: value,
      },
    }));
  };

  const handleSpacingChange = (event, value) => {
    setThemeSettings((prev) => ({
      ...prev,
      spacing: value,
    }));
  };

  const handleBorderRadiusChange = (event, value) => {
    setThemeSettings((prev) => ({
      ...prev,
      borderRadius: value,
    }));
  };

  const handleSave = async () => {
    try {
      // Convert theme settings to MUI theme format
      const newTheme = {
        palette: {
          primary: {
            main: themeSettings.colors.primary,
          },
          secondary: {
            main: themeSettings.colors.secondary,
          },
          background: {
            default: themeSettings.colors.background,
            paper: themeSettings.colors.surface,
          },
          error: {
            main: themeSettings.colors.error,
          },
          warning: {
            main: themeSettings.colors.warning,
          },
          success: {
            main: themeSettings.colors.success,
          },
          text: {
            primary: themeSettings.colors.text,
          },
        },
        typography: {
          fontSize: themeSettings.typography.fontSize,
          fontFamily: themeSettings.typography.fontFamily,
          h1: {
            fontSize: themeSettings.typography.h1.fontSize,
            fontWeight: themeSettings.typography.h1.fontWeight,
          },
          body1: {
            fontSize: themeSettings.typography.body1.fontSize,
            lineHeight: themeSettings.typography.body1.lineHeight,
          },
        },
        spacing: themeSettings.spacing,
        shape: {
          borderRadius: themeSettings.borderRadius,
        },
        shadows: [
          'none',
          themeSettings.shadows,
          // ... other shadow levels
        ],
      };

      await updateTheme(newTheme);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleReset = () => {
    resetTheme();
    // Reset local state to default theme values
    setThemeSettings({
      colors: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        background: theme.palette.background.default,
        surface: theme.palette.background.paper,
        error: theme.palette.error.main,
        warning: theme.palette.warning.main,
        success: theme.palette.success.main,
        text: theme.palette.text.primary,
      },
      typography: {
        fontSize: theme.typography.fontSize,
        fontFamily: theme.typography.fontFamily,
        h1: {
          fontSize: theme.typography.h1.fontSize,
          fontWeight: theme.typography.h1.fontWeight,
        },
        body1: {
          fontSize: theme.typography.body1.fontSize,
          lineHeight: theme.typography.body1.lineHeight,
        },
      },
      spacing: theme.spacing(1),
      borderRadius: theme.shape.borderRadius,
      shadows: theme.shadows[1],
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Theme Customization</Typography>
          <Box>
            <Button
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              sx={{ mr: 1 }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Box>
        </Box>

        <Collapse in={showAlert}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Theme settings saved successfully!
          </Alert>
        </Collapse>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Colors" />
          <Tab label="Typography" />
          <Tab label="Layout" />
        </Tabs>

        {/* Colors Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Color Palette
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {Object.entries(themeSettings.colors).map(([key, value]) => (
                  <Box
                    key={key}
                    onClick={() => setSelectedColor({ key, value })}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: value,
                      cursor: 'pointer',
                      border: selectedColor.key === key ? '2px solid black' : '1px solid #ccc',
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
              <SketchPicker
                color={selectedColor.value}
                onChange={handleColorChange}
                disableAlpha
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              {/* Add preview components here */}
            </Grid>
          </Grid>
        )}

        {/* Typography Tab */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Typography Settings
              </Typography>
              <TextField
                fullWidth
                label="Base Font Size"
                type="number"
                value={themeSettings.typography.fontSize}
                onChange={(e) => handleTypographyChange('fontSize', e.target.value)}
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Font Family"
                value={themeSettings.typography.fontFamily}
                onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                margin="normal"
              />
              {/* Add more typography settings */}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h1">Heading 1</Typography>
                <Typography variant="h2">Heading 2</Typography>
                <Typography variant="body1">
                  This is a sample paragraph text to preview the typography settings.
                  You can see how different text styles appear with the current configuration.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Layout Tab */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Layout Settings
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Base Spacing Unit</Typography>
                <Slider
                  value={themeSettings.spacing}
                  onChange={handleSpacingChange}
                  min={4}
                  max={16}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Border Radius</Typography>
                <Slider
                  value={themeSettings.borderRadius}
                  onChange={handleBorderRadiusChange}
                  min={0}
                  max={24}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              {/* Add layout preview components */}
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default ThemeCustomizer;
