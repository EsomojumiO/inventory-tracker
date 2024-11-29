import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Button,
  useTheme as useMuiTheme
} from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const ThemeSettings = () => {
  const muiTheme = useMuiTheme();
  const { theme, updateTheme, updateThemePreferences } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localTheme, setLocalTheme] = useState({
    palette: {
      primary: { main: muiTheme.palette.primary.main },
      secondary: { main: muiTheme.palette.secondary.main },
      background: { 
        default: muiTheme.palette.background.default,
        paper: muiTheme.palette.background.paper
      }
    }
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalTheme({
      palette: {
        primary: { main: muiTheme.palette.primary.main },
        secondary: { main: muiTheme.palette.secondary.main },
        background: { 
          default: muiTheme.palette.background.default,
          paper: muiTheme.palette.background.paper
        }
      }
    });
  }, [muiTheme]);

  const handleColorChange = (color, type) => {
    setLocalTheme(prev => ({
      ...prev,
      palette: {
        ...prev.palette,
        [type]: { 
          ...prev.palette[type],
          main: color 
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!user?.token) {
        throw new Error('Authentication required');
      }

      // First update the theme preferences in the backend
      const success = await updateThemePreferences({
        mode: 'light',
        primaryColor: localTheme.palette.primary.main,
        secondaryColor: localTheme.palette.secondary.main
      });

      if (!success) {
        throw new Error('Failed to save theme preferences');
      }

      // Then update the local theme
      const success2 = await updateTheme(localTheme);
      if (!success2) {
        throw new Error('Failed to apply theme changes');
      }

      showSuccess('Theme updated successfully');
    } catch (err) {
      setError(err.message);
      showError('Failed to update theme: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Theme Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Primary Color
            </Typography>
            <Box
              sx={{
                width: 100,
                height: 100,
                bgcolor: localTheme.palette.primary.main,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2
              }}
              onClick={() => {
                setSelectedColor('primary');
                setShowColorPicker(true);
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Secondary Color
            </Typography>
            <Box
              sx={{
                width: 100,
                height: 100,
                bgcolor: localTheme.palette.secondary.main,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2
              }}
              onClick={() => {
                setSelectedColor('secondary');
                setShowColorPicker(true);
              }}
            />
          </Grid>
        </Grid>

        {showColorPicker && selectedColor && (
          <Box sx={{ mt: 2 }}>
            <HexColorPicker
              color={localTheme.palette[selectedColor].main}
              onChange={(color) => handleColorChange(color, selectedColor)}
            />
            <Button
              sx={{ mt: 2 }}
              onClick={() => setShowColorPicker(false)}
            >
              Close Color Picker
            </Button>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ThemeSettings;
