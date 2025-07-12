import React from 'react';
import { en } from './languages/en';
import { hi } from './languages/hi';
import { ml } from './languages/ml';
import { ta } from './languages/ta';

export type Language = 'en' | 'hi' | 'ml' | 'ta';

export const languages = {
  en,
  hi,
  ml,
  ta,
};

export const languageNames = {
  en: 'English',
  hi: 'हिंदी',
  ml: 'മലയാളം',
  ta: 'தமிழ்',
};

export const languageCodes = {
  en: 'en',
  hi: 'hi',
  ml: 'ml',
  ta: 'ta',
};

// Default language
export const defaultLanguage: Language = 'en';

// Get current language from AsyncStorage or use default
export const getCurrentLanguage = async (): Promise<Language> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const storedLanguage = await AsyncStorage.getItem('userLanguage');
    return (storedLanguage as Language) || defaultLanguage;
  } catch (error) {
    console.error('Error getting language preference:', error);
    return defaultLanguage;
  }
};

// Set language preference
export const setLanguage = async (language: Language): Promise<void> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('userLanguage', language);
  } catch (error) {
    console.error('Error setting language preference:', error);
  }
};

// Get translation function
export const getTranslation = (language: Language) => {
  return languages[language] || languages[defaultLanguage];
};

// Translation hook for components
export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>(defaultLanguage);
  const [translations, setTranslations] = React.useState(languages[defaultLanguage]);

  React.useEffect(() => {
    const loadLanguage = async () => {
      const language = await getCurrentLanguage();
      setCurrentLanguage(language);
      setTranslations(languages[language]);
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (language: Language) => {
    await setLanguage(language);
    setCurrentLanguage(language);
    setTranslations(languages[language]);
  };

  return {
    t: translations,
    currentLanguage,
    changeLanguage,
    languageNames,
  };
};

// Simple translation function for non-component usage
export const t = (key: string, language: Language = defaultLanguage): string => {
  const translations = languages[language] || languages[defaultLanguage];
  
  // Navigate through nested objects using dot notation
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
};

export default {
  languages,
  languageNames,
  languageCodes,
  defaultLanguage,
  getCurrentLanguage,
  setLanguage,
  getTranslation,
  useTranslation,
  t,
}; 