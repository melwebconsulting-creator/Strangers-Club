import React, { createContext, useContext, useEffect, useState } from 'react';
import { SiteConfig } from '../types';
import { StorageService, DEFAULT_SITE_CONFIG, subscribeToRealtimeChanges } from '../services/storage';

interface ThemeContextType {
  config: SiteConfig;
  updateConfig: (newConfig: Partial<SiteConfig>) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(() => StorageService.getSiteConfig());

  // Listen for realtime config updates from other tabs / owner dashboard
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeChanges((type, payload) => {
      if (type === 'CONFIG_UPDATED') {
        setConfig(StorageService.getSiteConfig());
      }
    });
    return unsubscribe;
  }, []);

  // Dynamically apply primary and accent color CSS variables and document title
  useEffect(() => {
    document.title = `${config.siteName} - ${config.tagline}`;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', config.primaryColor);
    root.style.setProperty('--color-accent', config.accentColor);
    root.style.setProperty('--color-bg', config.backgroundColor);
  }, [config]);

  const updateConfig = (updates: Partial<SiteConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    StorageService.saveSiteConfig(updated);
  };

  const resetToDefault = () => {
    setConfig(DEFAULT_SITE_CONFIG);
    StorageService.saveSiteConfig(DEFAULT_SITE_CONFIG);
  };

  return (
    <ThemeContext.Provider value={{ config, updateConfig, resetToDefault }}>
      <div
        style={{
          backgroundColor: config.backgroundColor,
          fontFamily:
            config.fontFamily === 'jakarta'
              ? "'Plus Jakarta Sans', sans-serif"
              : config.fontFamily === 'nunito'
              ? "'Nunito', sans-serif"
              : "'Quicksand', 'Plus Jakarta Sans', sans-serif",
        }}
        className="min-h-screen text-slate-800 transition-colors duration-300"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
