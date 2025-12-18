
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Theme = string;

interface UIStateContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isStreamMode: boolean;
  setIsStreamMode: (value: boolean) => void;
  isStudioMode: boolean;
  setIsStudioMode: (value: boolean) => void;
  globalAnalyser: AnalyserNode | null;
  setGlobalAnalyser: (analyser: AnalyserNode | null) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('normal');
  const [isStreamMode, setIsStreamMode] = useState(false);
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [globalAnalyser, setGlobalAnalyser] = useState<AnalyserNode | null>(null);

  return (
    <UIStateContext.Provider value={{ 
      theme, 
      setTheme, 
      isStreamMode, 
      setIsStreamMode,
      isStudioMode,
      setIsStudioMode,
      globalAnalyser,
      setGlobalAnalyser
    }}>
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
