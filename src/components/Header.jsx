import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';

export default function Header({ title, role }) {
  const { currentUser, userRole, userData } = useAuth();
  
  // Format role for display
  const effectiveRole = role || userRole;
  const displayRole = effectiveRole === 'admin' ? 'مدير النظام' : 
                      effectiveRole === 'teacher' ? 'معلم' : 'طالب';

  const displayName = userData?.name || currentUser?.email?.split('@')[0] || 'المستخدم';

  return (
    <header className="top-header">
      <div className="header-title">{title}</div>
      
      <div className="header-actions">
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
