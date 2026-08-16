import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Users, BookOpen, Calendar, Home, Settings, FileText, Star } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const adminLinks = [
    { path: '/admin', icon: Home, label: t('sidebar.overview') },
    { path: '/admin/teachers', icon: Users, label: t('sidebar.teachers') },
    { path: '/admin/students', icon: Users, label: t('sidebar.students') },
    { path: '/admin/classes', icon: BookOpen, label: t('sidebar.classes') },
    { path: '/admin/schedule', icon: Calendar, label: t('sidebar.schedule') },
    { path: '/admin/preparations', icon: BookOpen, label: t('sidebar.preparations') },
    { path: '/admin/weekly-plan', icon: BookOpen, label: t('sidebar.weeklyPlan') },
    { path: '/admin/excellence', icon: Star, label: t('sidebar.files') },
    { path: '/admin/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const superAdminLinks = [
    { path: '/superadmin', icon: Home, label: t('sidebar.superAdminDashboard') },
  ];

  const teacherLinks = [
    { path: '/teacher', icon: Home, label: t('sidebar.overview') },
    { path: '/teacher/preparation', icon: BookOpen, label: t('sidebar.preparations') },
    { path: '/teacher/weekly-plan', icon: Calendar, label: t('sidebar.weeklyPlan') },
    { path: '/teacher/schedule', icon: Calendar, label: t('sidebar.schedule') },
    { path: '/teacher/assignments', icon: BookOpen, label: t('sidebar.assignments') },
    { path: '/teacher/exams', icon: FileText, label: t('sidebar.exams') },
    { path: '/teacher/materials', icon: BookOpen, label: t('sidebar.materials') },
    { path: '/teacher/attendance', icon: Users, label: t('sidebar.attendance') },
    { path: '/teacher/excellence', icon: Star, label: t('sidebar.files') },
    { path: '/teacher/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const studentLinks = [
    { path: '/student', icon: Home, label: t('sidebar.overview') },
    { path: '/student/weekly-plan', icon: Calendar, label: t('sidebar.weeklyPlan') },
    { path: '/student/schedule', icon: Calendar, label: t('sidebar.schedule') },
    { path: '/student/assignments', icon: BookOpen, label: t('sidebar.assignments') },
    { path: '/student/exams', icon: FileText, label: t('sidebar.exams') },
    { path: '/student/materials', icon: BookOpen, label: t('sidebar.materials') },
    { path: '/student/preparations', icon: BookOpen, label: t('sidebar.studentPreparations') },
    { path: '/student/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const links = role === 'superadmin' ? superAdminLinks : role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;
  
  const logoSrc = userData?.logoUrl || `${import.meta.env.BASE_URL}logo.webp`;

  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', padding: '20px 0', gap: '10px' }}>
        <img 
          src={logoSrc} 
          alt="School Logo" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${import.meta.env.BASE_URL}default_logo.png`;
          }}
          style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain' }} 
        />
      </div>
      
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === `/${role}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px' }}>
        <button className="nav-item" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
          <LogOut size={20} />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </div>
  );
}
