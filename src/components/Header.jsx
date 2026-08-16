import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, Globe } from 'lucide-react';

export default function Header({ title, role }) {
  const { currentUser, userRole, userData } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  
  // Format role for display
  const effectiveRole = role || userRole;
  const displayRole = effectiveRole === 'superadmin' ? t('header.master') : 
                      effectiveRole === 'admin' ? (userData?.schoolName || t('header.schoolManager')) : 
                      effectiveRole === 'teacher' ? t('header.teacher') : t('header.student');

  const displayName = userData?.name || currentUser?.email?.split('@')[0] || t('header.user');

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
            {lang === 'ar' ? t('header.english') : t('header.arabic')}
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
