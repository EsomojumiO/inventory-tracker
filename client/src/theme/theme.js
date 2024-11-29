import { createTheme } from '@mui/material/styles';

// Minimalistic color palette
const colors = {
  light: {
    primary: {
      main: '#2D3648', // Deep blue-grey
      light: '#4A5568',
      dark: '#1A202C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#718096', // Muted blue-grey
      light: '#A0AEC0',
      dark: '#4A5568',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
      subtle: '#EDF2F7',
    },
    text: {
      primary: '#2D3648',
      secondary: '#718096',
    },
    divider: 'rgba(0, 0, 0, 0.06)',
    success: {
      main: '#48BB78',
      light: '#68D391',
      dark: '#38A169',
    },
    warning: {
      main: '#ECC94B',
      light: '#F6E05E',
      dark: '#D69E2E',
    },
    error: {
      main: '#F56565',
      light: '#FC8181',
      dark: '#E53E3E',
    },
  },
  dark: {
    primary: {
      main: '#90CDF4', // Light blue
      light: '#BEE3F8',
      dark: '#63B3ED',
      contrastText: '#1A202C',
    },
    secondary: {
      main: '#A0AEC0', // Cool grey
      light: '#CBD5E0',
      dark: '#718096',
      contrastText: '#1A202C',
    },
    background: {
      default: '#1A202C',
      paper: '#2D3748',
      subtle: '#2D3748',
    },
    text: {
      primary: '#F7FAFC',
      secondary: '#E2E8F0',
    },
    divider: 'rgba(255, 255, 255, 0.06)',
    success: {
      main: '#48BB78',
      light: '#68D391',
      dark: '#38A169',
    },
    warning: {
      main: '#ECC94B',
      light: '#F6E05E',
      dark: '#D69E2E',
    },
    error: {
      main: '#F56565',
      light: '#FC8181',
      dark: '#E53E3E',
    },
  },
};

function getTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode,
      ...colors[mode],
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light'
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
  });
}

export default getTheme;
