import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Theme = string;

interface UIStateContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('normal');

  return (
    <UIStateContext.Provider value={{ theme, setTheme }}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};