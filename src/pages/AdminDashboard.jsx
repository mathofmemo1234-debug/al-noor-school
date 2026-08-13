import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, BookOpen, UserPlus, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

function AdminHome() {
  const [modalType, setModalType] = useState(null); // 'teacher' or 'student'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [extraInfo, setExtraInfo] = useState(''); // Subject for teacher, Class for student
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState({ teachers: 0, students: 0 });

  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      setStats(prev => ({ ...prev, teachers: snap.size }));
    });
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
    });
    return () => { unsubTeachers(); unsubStudents(); };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSaving(true);
    try {
      const collectionName = modalType === 'teacher' ? 'teachers' : 'students';
      await addDoc(collection(db, collectionName), {
        name,
        email,
        [modalType === 'teacher' ? 'subject' : 'class']: extraInfo,
        createdAt: new Date().toISOString()
      });
      
      // Also add to 'users' collection so they have a role when they sign up
      await addDoc(collection(db, 'users'), {
        email,
        role: modalType,
        name
      });

      alert(`تم إضافة ${modalType === 'teacher' ? 'المعلم' : 'الطالب'} بنجاح!`);
      setModalType(null);
      setName('');
      setEmail('');
      setExtraInfo('');
    } catch (error) {
      console.error("Error adding user:", error);
      alert('تعذر الحفظ، يرجى التحقق من صلاحيات Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon blue">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>إجمالي المعلمين</p>
            <h3>{stats.teachers}</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon green">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>إجمالي الطلاب</p>
            <h3>{stats.students}</h3>
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
          <button className="btn btn-primary" onClick={() => setModalType('teacher')}>
            <UserPlus size={18} /> إضافة معلم جديد
          </button>
          <button className="btn btn-secondary" onClick={() => setModalType('student')}>
            <UserPlus size={18} /> تسجيل طالب
          </button>
        </div>
      </div>

      {modalType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setModalType(null)} 
              style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '20px' }}>
              {modalType === 'teacher' ? 'إضافة معلم جديد' : 'تسجيل طالب جديد'}
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group">
                <label>الاسم الرباعي</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{modalType === 'teacher' ? 'المادة الدراسية' : 'الفصل الدراسي'}</label>
                <input type="text" value={extraInfo} onChange={e => setExtraInfo(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageTeachers() {
  return <div className="glass-panel" style={{ padding: '24px' }}><h2>إدارة المعلمين</h2><p>سيتم عرض قائمة المعلمين هنا مع إمكانية التعديل والإضافة.</p></div>;
}

function ManageStudents() {
  return <div className="glass-panel" style={{ padding: '24px' }}><h2>إدارة الطلاب</h2><p>سيتم عرض قائمة الطلاب هنا مع إمكانية التعديل والإضافة.</p></div>;
}

function ManageClasses() {
  return <div className="glass-panel" style={{ padding: '24px' }}><h2>الفصول الدراسية</h2><p>هنا يمكنك إضافة وإدارة الفصول الدراسية وتوزيع الطلاب عليها.</p></div>;
}

export default function AdminDashboard() {
  return (
    <Layout role="admin" title="لوحة تحكم الإدارة">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/teachers" element={<ManageTeachers />} />
        <Route path="/students" element={<ManageStudents />} />
        <Route path="/classes" element={<ManageClasses />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </Layout>
  );
}
