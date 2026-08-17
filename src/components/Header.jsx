import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, Globe } from 'lucide-react';

export default function Header({ title, role }) {
  const { currentUser, userRole, userData } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  
  // Format role & extra info for display
  const effectiveRole = role || userRole;
  
  let extraDetail = '';
  if (effectiveRole === 'student') {
    const studentClass = userData?.class || userData?.className;
    if (studentClass) extraDetail = studentClass;
  } else if (effectiveRole === 'teacher') {
    const teacherSubject = userData?.subject;
    if (teacherSubject) extraDetail = teacherSubject;
  } else if (effectiveRole === 'staff') {
    if (userData?.roleTitle) extraDetail = userData.roleTitle;
  }

  let supervisorSpecialty = '';
  if (effectiveRole === 'supervisor') {
    supervisorSpecialty = userData?.specialty || userData?.subject || '';
  }

  const displayRole = effectiveRole === 'superadmin' ? 'الماستر' : 
                      effectiveRole === 'admin' ? (userData?.schoolName ? `مدير • ${userData.schoolName}` : 'مدير') : 
                      effectiveRole === 'staff' ? (userData?.schoolName ? `${userData?.roleTitle || 'كادر مدرسي'} • ${userData.schoolName}` : (userData?.roleTitle || 'كادر مدرسي')) :
                      effectiveRole === 'supervisor' ? (userData?.schoolName ? `مشرف تعليمي${supervisorSpecialty ? ` (${supervisorSpecialty})` : ''} • ${userData.schoolName}` : `مشرف تعليمي${supervisorSpecialty ? ` (${supervisorSpecialty})` : ''}`) :
                      effectiveRole === 'teacher' ? (extraDetail ? `معلم • ${extraDetail}` : 'معلم') : 
                      (extraDetail ? `طالب • ${extraDetail}` : 'طالب');

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
          <Globe size={20} color="#0e7490" />
          <span style={{ fontWeight: 'bold', color: '#0e7490' }}>
            {lang === 'ar' ? t('header.english') : t('header.arabic')}
          </span>
        </button>
        <button className="btn" style={{ background: 'transparent', padding: '8px' }}>
          <Bell size={20} color="var(--color-text-muted)" />
        </button>
        
        <div className="user-profile">
          <div className="user-info" style={{ textAlign: 'start' }}>
            <span className="user-name" style={{ color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>
              {displayName}
              {extraDetail && (
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#0e7490', 
                  background: 'rgba(99, 178, 198, 0.15)', 
                  padding: '2px 8px', 
                  borderRadius: '10px',
                  marginInlineStart: '8px',
                  display: 'inline-block'
                }}>
                  {extraDetail}
                </span>
              )}
            </span>
            <span className="user-role" style={{ color: '#0e7490', fontWeight: '600', fontSize: '13px', display: 'block', marginTop: '2px' }}>
              {displayRole}
            </span>
          </div>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #0e7490, #63B2C6)', color: 'white', fontWeight: 'bold' }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
