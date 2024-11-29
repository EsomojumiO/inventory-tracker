import { createContext, useContext } from 'react';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export const ThemeModeProvider = ({ value, children }) => {
  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

export default ThemeModeContext;
