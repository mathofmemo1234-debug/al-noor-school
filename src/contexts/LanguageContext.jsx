import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

function setTranslateCookie(targetLang) {
  try {
    const cookieVal = targetLang === 'en' ? '/ar/en' : '/ar/ar';
    const host = window.location.hostname;
    
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${parts.slice(-2).join('.')};`;
      }
    }
  } catch (err) {
    console.warn('Translate cookie error:', err);
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('appLang') || 'ar';
  });

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('appLang', lang);

    setTranslateCookie(lang);

    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = lang;
      selectElem.dispatchEvent(new Event('change'));
      selectElem.dispatchEvent(new Event('input'));
    }
  }, [lang]);

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('appLang', nextLang);
    setTranslateCookie(nextLang);

    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = nextLang;
      selectElem.dispatchEvent(new Event('change'));
      selectElem.dispatchEvent(new Event('input'));
    } else {
      window.location.reload();
    }
  };

  const t = (key) => {
    return translations['ar']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
