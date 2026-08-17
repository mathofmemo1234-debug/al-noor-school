import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bell, Globe, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Header({ title, role }) {
  const { currentUser, userRole, userData } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  
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

  const schoolId = userData?.schoolId || 'main_school';
  const myNid = (userData?.nationalId || currentUser?.email?.replace('@school.local', '') || currentUser?.uid || '').trim();
  const myClass = (userData?.class || userData?.className || '')?.trim();

  // Listen to unread messages
  useEffect(() => {
    const myIdentities = new Set([
      myNid,
      userData?.nationalId,
      userData?.id,
      currentUser?.uid,
      currentUser?.email,
      currentUser?.email?.split('@')[0],
      userData?.name
    ].filter(Boolean).map(s => String(s).trim().toLowerCase()));

    const unsub = onSnapshot(collection(db, 'school_messages'), (snap) => {
      let count = 0;
      snap.docs.forEach(docSnap => {
        const msg = docSnap.data();
        if (schoolId && schoolId !== 'main_school' && msg.schoolId && msg.schoolId !== schoolId) return;

        const readBy = msg.readBy || [];
        const hasRead = Array.isArray(readBy) && readBy.some(id => myIdentities.has(String(id).trim().toLowerCase()));
        if (hasRead) return; // already read

        // Check if current user is the sender of a direct message
        const senderNid = String(msg.senderNationalId || '').trim().toLowerCase();
        const senderId = String(msg.senderId || '').trim().toLowerCase();
        if (msg.messageType === 'individual' && (myIdentities.has(senderNid) || myIdentities.has(senderId))) {
          return;
        }

        // Check if message belongs to this user
        if (msg.messageType === 'individual') {
          const recNid = String(msg.receiverNationalId || '').trim().toLowerCase();
          const recId = String(msg.receiverId || '').trim().toLowerCase();
          const recEmail = String(msg.receiverEmail || '').trim().toLowerCase();
          const recName = String(msg.receiverName || '').trim().toLowerCase();

          if (myIdentities.has(recNid) || myIdentities.has(recId) || myIdentities.has(recEmail) || (recName && myIdentities.has(recName))) {
            count++;
          }
        } else if (msg.messageType === 'group') {
          if (!msg.targetGroup || msg.targetGroup === 'all') count++;
          else if (msg.targetGroup === 'teachers' && (effectiveRole === 'teacher' || userData?.role === 'teacher' || !!userData?.subject)) count++;
          else if (msg.targetGroup === 'students' && (effectiveRole === 'student' || userData?.role === 'student')) count++;
          else if (msg.targetGroup === 'class' && (effectiveRole === 'student' || userData?.role === 'student')) {
            const targetCls = String(msg.targetClassName || '').trim().toLowerCase();
            const userCls = String(myClass || userData?.class || userData?.className || '').trim().toLowerCase();
            if (targetCls && userCls && (targetCls === userCls || userCls.includes(targetCls) || targetCls.includes(userCls))) {
              count++;
            }
          }
          else if (msg.targetGroup === 'staff' && (effectiveRole === 'staff' || effectiveRole === 'admin')) count++;
          else if (msg.targetGroup === 'supervisors' && effectiveRole === 'supervisor') count++;
        }
      });
      setUnreadMsgCount(count);
    });

    return () => unsub();
  }, [schoolId, myNid, effectiveRole, myClass, currentUser, userData]);

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

        {/* Messaging Quick Button */}
        <button
          className="btn"
          onClick={() => navigate(`/${effectiveRole}/messages`)}
          style={{ background: 'transparent', padding: '8px', position: 'relative', cursor: 'pointer' }}
          title="المراسلات والتعاميم"
        >
          <Mail size={20} color="#0e7490" />
          {unreadMsgCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '900',
              borderRadius: '10px',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white'
            }}>
              {unreadMsgCount}
            </span>
          )}
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
