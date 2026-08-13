import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, BookOpen, UserPlus } from 'lucide-react';

function AdminHome() {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon blue">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>إجمالي المعلمين</p>
            <h3>45</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon green">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>إجمالي الطلاب</p>
            <h3>850</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon orange">
            <BookOpen size={32} />
          </div>
          <div className="stat-info">
            <p>الفصول الدراسية</p>
            <h3>32</h3>
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>الإجراءات السريعة</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-primary"><UserPlus size={18} /> إضافة معلم جديد</button>
          <button className="btn btn-secondary"><UserPlus size={18} /> تسجيل طالب</button>
        </div>
      </div>
    </div>
  );
}

function ManageTeachers() {
  return <div className="glass-panel" style={{ padding: '24px' }}><h2>إدارة المعلمين</h2><p>سيتم عرض قائمة المعلمين هنا مع إمكانية التعديل والإضافة.</p></div>;
}

function ManageStudents() {
  return <div className="glass-panel" style={{ padding: '24px' }}><h2>إدارة الطلاب</h2><p>سيتم عرض قائمة الطلاب هنا مع إمكانية التعديل والإضافة.</p></div>;
}

export default function AdminDashboard() {
  return (
    <Layout role="admin" title="لوحة تحكم الإدارة">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/teachers" element={<ManageTeachers />} />
        <Route path="/students" element={<ManageStudents />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </Layout>
  );
}
