import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Users, BookOpen, Calendar, Home, Settings } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar({ role }) {
  const navigate = useNavigate();

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
    { path: '/admin/classes', icon: BookOpen, label: 'الفصول الدراسية' },
    { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  ];

  const teacherLinks = [
    { path: '/teacher', icon: Home, label: 'المهام (الرئيسية)' },
    { path: '/teacher/weekly-plan', icon: Calendar, label: 'الخطة الأسبوعية' },
    { path: '/teacher/assignments', icon: BookOpen, label: 'الواجبات' },
    { path: '/teacher/attendance', icon: Users, label: 'الغياب والحضور' },
  ];

  const studentLinks = [
    { path: '/student', icon: Home, label: 'الرئيسية' },
    { path: '/student/schedule', icon: Calendar, label: 'الجدول الدراسي' },
    { path: '/student/assignments', icon: BookOpen, label: 'الواجبات' },
    { path: '/student/materials', icon: BookOpen, label: 'الملخصات' },
  ];

  let links = [];
  if (role === 'admin') links = adminLinks;
  if (role === 'teacher') links = teacherLinks;
  if (role === 'student') links = studentLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" style={{ background: 'transparent', boxShadow: 'none', width: '50px', height: '50px' }}>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <path d="M100 20 L40 140 H70 L100 80 L130 140 H160 Z" fill="#63B2C6" />
            <path d="M50 110 Q100 80 150 110 L140 130 Q100 100 60 130 Z" fill="#B4D396" />
          </svg>
        </div>
        <div className="sidebar-title" style={{ fontSize: '1rem' }}>
          المدارس المتقدمة<br/>للتعلم الذكي بجدة
        </div>
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
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn btn-secondary btn-block" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
          <LogOut size={18} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
