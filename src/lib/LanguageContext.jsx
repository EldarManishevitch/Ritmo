import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

export const LANGUAGES = [
  { code: 'es-ES', lang: 'Spanish', nativeName: 'Español', flag: '🇪🇸', translationLocale: 'es' },
  { code: 'fr-FR', lang: 'French', nativeName: 'Français', flag: '🇫🇷', translationLocale: 'fr' },
  { code: 'it-IT', lang: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', translationLocale: 'it' },
  { code: 'de-DE', lang: 'German', nativeName: 'Deutsch', flag: '🇩🇪', translationLocale: 'de' },
  { code: 'pt-BR', lang: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', translationLocale: 'pt' },
];

const LanguageContext = createContext();

const STORAGE_KEY = 'selected_learning_language';

const getStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return LANGUAGES.find((l) => l.lang === stored) || LANGUAGES[0];
  } catch { /* noop */ }
  return LANGUAGES[0];
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getStoredLanguage());

  const languageObj = LANGUAGES.find((l) => l.lang === language.lang) || LANGUAGES[0];

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
  }, []);

  const switchLanguage = useCallback((newLang) => {
    localStorage.setItem(STORAGE_KEY, newLang.lang);
    setLanguageState(newLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ ...languageObj, forceUnset: languageObj.lang !== language.lang, language, setLanguage, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { ...LANGUAGES[0], switchLanguage: () => {} };
  return ctx;
};