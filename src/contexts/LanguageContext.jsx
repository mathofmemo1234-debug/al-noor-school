import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const { userData } = useAuth();
  
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('alnoor_appLang') || 'ar';
  });

  // Automatically detect and sync language with the school's configured or detected language
  useEffect(() => {
    const schoolId = userData?.schoolId;
    const rawSchoolName = userData?.schoolName || '';
    const isInternationalName = (name) => {
      const lower = (name || '').toLowerCase();
      return (
        lower.includes('عالمي') || 
        lower.includes('عالمية') || 
        lower.includes('international') || 
        lower.includes('american') ||
        lower.includes('intl')
      );
    };

    if (!schoolId || schoolId === 'ALL') {
      if (isInternationalName(rawSchoolName)) {
        setLang('en');
      }
      return;
    }

    const unsub = onSnapshot(doc(db, 'schools', schoolId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.defaultLanguage) {
          setLang(data.defaultLanguage);
        } else {
          // Auto-detect from school name
          if (isInternationalName(data.name || rawSchoolName)) {
            setLang('en');
          } else {
            setLang('ar');
          }
        }
      } else {
        if (isInternationalName(rawSchoolName)) {
          setLang('en');
        }
      }
    }, (err) => {
      console.warn('LanguageContext school listener error:', err);
    });

    return () => unsub();
  }, [userData?.schoolId, userData?.schoolName]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('alnoor_appLang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['ar']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
