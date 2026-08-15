import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Globe } from 'lucide-react';

export default function Header({ title, role }) {
  const { currentUser, userRole, userData } = useAuth();
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    if (document.cookie.includes('googtrans=/ar/en') || document.cookie.includes('googtrans=/auto/en')) {
      setLang('en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } else {
      setLang('ar');
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
  }, []);

  const toggleLanguage = () => {
    if (lang === 'ar') {
      document.cookie = `googtrans=/ar/en; path=/`;
      document.cookie = `googtrans=/ar/en; domain=.${window.location.hostname}; path=/`;
      window.location.reload();
    } else {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
      document.cookie = `googtrans=/ar/ar; path=/`;
      window.location.reload();
    }
  };
  
  // Format role for display
  const effectiveRole = role || userRole;
  const displayRole = effectiveRole === 'superadmin' ? 'الماستر' : 
                      effectiveRole === 'admin' ? (userData?.schoolName || 'مدير مجمع') : 
                      effectiveRole === 'teacher' ? 'معلم' : 'طالب';

  const displayName = userData?.name || currentUser?.email?.split('@')[0] || 'المستخدم';

  return (
    <header className="top-header">
      <div className="header-title">{title}</div>
      
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="btn" 
          onClick={toggleLanguage}
          style={{ background: 'transparent', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Globe size={20} color="var(--color-primary-dark)" />
          <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
            {lang === 'ar' ? 'EN' : 'عربي'}
          </span>
        </button>
        <button className="btn" style={{ background: 'transparent', padding: '8px' }}>
          <Bell size={20} color="var(--color-text-muted)" />
        </button>
        
        <div className="user-profile">
          <div className="user-info" style={{ textAlign: 'left' }}>
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
