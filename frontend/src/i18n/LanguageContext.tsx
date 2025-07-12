import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, getCurrentLanguage, setLanguage, languages, languageNames } from './index';

interface LanguageContextType {
  currentLanguage: Language;
  translations: any;
  changeLanguage: (language: Language) => Promise<void>;
  languageNames: typeof languageNames;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState(languages['en']);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await getCurrentLanguage();
        setCurrentLanguage(savedLanguage);
        setTranslations(languages[savedLanguage]);
      } catch (error) {
        console.error('Error initializing language:', error);
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = async (language: Language) => {
    try {
      await setLanguage(language);
      setCurrentLanguage(language);
      setTranslations(languages[language]);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      translations,
      changeLanguage,
      languageNames,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 