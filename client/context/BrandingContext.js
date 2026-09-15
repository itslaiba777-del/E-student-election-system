'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const BrandingContext = createContext({
  universityName: 'E-Election System',
  campusName: '',
  logoUrl: '',
  registrationPattern: '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
  systemTitle: 'E-Election System',
  isConfigured: false,
  refreshBranding: () => {},
});

export function BrandingProvider({ children }) {
  const [settings, setSettings] = useState({
    university_name: '',
    campus_name: '',
    logo_url: '',
    registration_number_pattern: '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/system/settings`);
      if (res.data?.settings) {
        setSettings((prev) => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.warn('Branding API fetch fallback:', err);
    }
  };

  const isConfigured = !!(settings.university_name && settings.university_name.trim());
  const universityName = isConfigured ? settings.university_name.trim() : 'E-Election System';
  const campusName = settings.campus_name || '';
  const logoUrl = settings.logo_url
    ? settings.logo_url.startsWith('http')
      ? settings.logo_url
      : `http://localhost:5000${settings.logo_url}`
    : '';
  const registrationPattern = settings.registration_number_pattern || '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$';
  const systemTitle = isConfigured ? `${universityName} E-Election System` : 'E-Election System';

  return (
    <BrandingContext.Provider
      value={{
        universityName,
        campusName,
        logoUrl,
        registrationPattern,
        systemTitle,
        isConfigured,
        settings,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
