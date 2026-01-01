
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Theme = string;
export type StreamScene = 'synapse' | 'vortex' | 'mission' | 'intel';

interface UIStateContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isStreamMode: boolean;
  setIsStreamMode: (value: boolean) => void;
  isStudioMode: boolean;
  setIsStudioMode: (value: boolean) => void;
  globalAnalyser: AnalyserNode | null;
  setGlobalAnalyser: (analyser: AnalyserNode | null) => void;
  streamScene: StreamScene;
  setStreamScene: (scene: StreamScene) => void;
  isCleanFeed: boolean;
  setIsCleanFeed: (value: boolean) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('normal');
  const [isStreamMode, setIsStreamMode] = useState(false);
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [globalAnalyser, setGlobalAnalyser] = useState<AnalyserNode | null>(null);
  const [streamScene, setStreamScene] = useState<StreamScene>('synapse');
  const [isCleanFeed, setIsCleanFeed] = useState(false);

  return (
    <UIStateContext.Provider value={{ 
      theme, 
      setTheme, 
      isStreamMode, 
      setIsStreamMode,
      isStudioMode,
      setIsStudioMode,
      globalAnalyser,
      setGlobalAnalyser,
      streamScene,
      setStreamScene,
      isCleanFeed,
      setIsCleanFeed
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
