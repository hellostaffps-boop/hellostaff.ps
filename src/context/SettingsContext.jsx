import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPlatformSettings } from '@/lib/services/settingsService';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getPlatformSettings();
      if (data) {
        setSettings(data);
        applySettingsToDOM(data);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const applySettingsToDOM = (data) => {
    const root = document.documentElement;
    if (data.primary_color) {
      root.style.setProperty('--primary', data.primary_color);
    }
    if (data.accent_color) {
      root.style.setProperty('--accent', data.accent_color);
      root.style.setProperty('--ring', data.accent_color);
    }
    if (data.font_family) {
      root.style.setProperty('--font-inter', `"${data.font_family}", sans-serif`);
      root.style.setProperty('--font-arabic', `"${data.font_family}", sans-serif`);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
