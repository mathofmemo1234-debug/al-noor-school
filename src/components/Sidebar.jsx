import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Users, BookOpen, Calendar, Home, Settings, FileText, Star } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ role }) {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const adminLinks = [
    { path: '/admin', icon: Home, label: 'الرئيسية' },
    { path: '/admin/teachers', icon: Users, label: 'إدارة المعلمين' },
    { path: '/admin/students', icon: Users, label: 'إدارة الطلاب' },
    { path: '/admin/classes', icon: BookOpen, label: 'إدارة الفصول' },
    { path: '/admin/schedule', icon: Calendar, label: 'الجدول المدرسي' },
    { path: '/admin/preparations', icon: BookOpen, label: 'متابعة التحضير' },
    { path: '/admin/weekly-plan', icon: BookOpen, label: 'الخطة الأسبوعية' },
    { path: '/admin/excellence', icon: Star, label: 'ملفات التميز' },
    { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const superAdminLinks = [
    { path: '/superadmin', icon: Home, label: 'لوحة التحكم (ماستر)' },
  ];

  const teacherLinks = [
    { path: '/teacher', icon: Home, label: 'الرئيسية (مهام المعلم)' },
    { path: '/teacher/preparation', icon: BookOpen, label: 'تحضير الدروس' },
    { path: '/teacher/weekly-plan', icon: Calendar, label: 'الخطة الأسبوعية' },
    { path: '/teacher/schedule', icon: Calendar, label: 'الجدول المدرسي' },
    { path: '/teacher/assignments', icon: BookOpen, label: 'الواجبات' },
    { path: '/teacher/exams', icon: FileText, label: 'الاختبارات' },
    { path: '/teacher/materials', icon: BookOpen, label: 'المرفقات' },
    { path: '/teacher/attendance', icon: Users, label: 'رصد الغياب' },
    { path: '/teacher/excellence', icon: Star, label: 'ملفات التميز' },
    { path: '/teacher/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const studentLinks = [
    { path: '/student', icon: Home, label: 'الرئيسية' },
    { path: '/student/weekly-plan', icon: Calendar, label: 'الخطة الأسبوعية' },
    { path: '/student/schedule', icon: Calendar, label: 'الجدول الدراسي' },
    { path: '/student/assignments', icon: BookOpen, label: 'الواجبات' },
    { path: '/student/exams', icon: FileText, label: 'الاختبارات' },
    { path: '/student/materials', icon: BookOpen, label: 'المقررات' },
    { path: '/student/preparations', icon: BookOpen, label: 'عرض التحاضير' },
    { path: '/student/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const links = role === 'superadmin' ? superAdminLinks : role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;
  
  const logoSrc = userData?.logoUrl || '/logo.png';

  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', padding: '20px 0', gap: '10px' }}>
        <img src={logoSrc} alt="School Logo" style={{ maxWidth: '140px', maxHeight: '140px', objectFit: 'contain' }} />
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
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
