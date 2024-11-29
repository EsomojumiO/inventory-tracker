import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import config from '../config/config';

const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
    text: {
      primary: '#000000',
    },
  },
  typography: {
    fontSize: 14,
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 4,
  },
});

const predefinedThemes = {
  default: {
    light: {
      primary: '#1976d2',
      secondary: '#dc004e'
    },
    dark: {
      primary: '#90caf9',
      secondary: '#f48fb1'
    }
  },
  ocean: {
    light: {
      primary: '#006064',
      secondary: '#00acc1'
    },
    dark: {
      primary: '#4dd0e1',
      secondary: '#80deea'
    }
  },
  forest: {
    light: {
      primary: '#2e7d32',
      secondary: '#558b2f'
    },
    dark: {
      primary: '#81c784',
      secondary: '#aed581'
    }
  },
  sunset: {
    light: {
      primary: '#d84315',
      secondary: '#f4511e'
    },
    dark: {
      primary: '#ff8a65',
      secondary: '#ff8a65'
    }
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [theme, setTheme] = useState(defaultTheme);
  const [themePreferences, setThemePreferences] = useState({
    mode: 'light',
    primaryColor: '#1976d2',
    customTheme: 'default'
  });

  const updateTheme = useCallback(async (newThemeSettings) => {
    if (!user?.token) {
      throw new Error('Authentication required');
    }

    try {
      const updatedTheme = createTheme(newThemeSettings);
      setTheme(updatedTheme);
      localStorage.setItem('appTheme', JSON.stringify(newThemeSettings));
      return true;
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  }, [user?.token]);

  const resetTheme = useCallback(() => {
    setTheme(defaultTheme);
    localStorage.removeItem('appTheme');
  }, []);

  const updateThemePreferences = async (newThemePreferences) => {
    if (!user?.token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/settings/theme`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme: newThemePreferences })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update theme preferences');
      }

      setThemePreferences(newThemePreferences);
      return true;
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const fetchThemePreferences = async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/settings/preferences`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch theme preferences');
      }

      const data = await response.json();
      if (data.preferences?.theme) {
        setThemePreferences(data.preferences.theme);
      }
    } catch (error) {
      console.error('Error fetching theme preferences:', error);
      showError('Error loading theme preferences');
    }
  };

  useEffect(() => {
    fetchThemePreferences();
  }, [user?.token]); // Re-fetch when user token changes

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, themePreferences, updateThemePreferences }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
