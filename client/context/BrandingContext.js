'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

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

  const uniNameStr = typeof settings.university_name === 'string'
    ? settings.university_name.trim()
    : (settings.university_name && typeof settings.university_name === 'object' && settings.university_name.university_name)
      ? String(settings.university_name.university_name).trim()
      : (settings.university_name ? String(settings.university_name).trim() : '');

  const isConfigured = !!uniNameStr;
  const universityName = isConfigured ? uniNameStr : 'E-Election System';
  const campusName = typeof settings.campus_name === 'string' ? settings.campus_name : (settings.campus_name ? String(settings.campus_name) : '');
  
  const logoUrlStr = typeof settings.logo_url === 'string' 
    ? settings.logo_url 
    : (settings.logo_url && typeof settings.logo_url === 'object' && settings.logo_url.logo_url)
      ? String(settings.logo_url.logo_url)
      : (settings.logo_url ? String(settings.logo_url) : '');

  const logoUrl = logoUrlStr
    ? logoUrlStr.startsWith('http')
      ? logoUrlStr
      : `${SERVER_URL}${logoUrlStr}`
    : '';

  const registrationPattern = typeof settings.registration_number_pattern === 'string'
    ? settings.registration_number_pattern
    : '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$';

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
