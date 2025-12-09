"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSystemSettings, SystemSettingsDocument } from '@/lib/db';

interface SettingsContextType {
  settings: SystemSettingsDocument | null;
  updateSettings: (newSettings: Partial<SystemSettingsDocument>) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettingsDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await getSystemSettings();
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to fetch system settings:", error);
        // Fallback to default settings if API fails
        setSettings({
            siteName: 'المحترف لحساب الكميات',
            defaultLanguage: 'ar',
            maintenanceMode: false,
            maxUploadSizeMB: 25,
            emailNotificationsEnabled: true,
            loginAttemptsLimit: 5,
            passwordResetExpiry: 24,
            twoFactorAuth: false,
            notificationEmail: '',
            notificationFrequency: 'daily',
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
            fileScanning: true,
          });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateSettings = (newSettings: Partial<SystemSettingsDocument>) => {
    setSettings(prevSettings => {
      if (!prevSettings) return null;
      return { ...prevSettings, ...newSettings };
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
