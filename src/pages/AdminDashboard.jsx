import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, BookOpen, UserPlus, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';

function AdminHome() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });

  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      setStats(prev => ({ ...prev, teachers: snap.size }));
    });
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
    });
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setStats(prev => ({ ...prev, classes: snap.size }));
    });
    return () => { unsubTeachers(); unsubStudents(); unsubClasses(); };
  }, []);

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
            <h3>{stats.classes}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teachers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'teachers'), {
        name, email, subject, role: 'teacher', createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        email, role: 'teacher', name
      });
      setIsAdding(false);
      setName(''); setEmail(''); setSubject('');
    } catch (err) {
      console.error(err);
      alert('خطأ في الحفظ. تأكد من الصلاحيات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>إدارة المعلمين</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          إضافة معلم جديد
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {teachers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>لا يوجد معلمين مضافين بعد.</p>
        ) : (
          teachers.map(t => (
            <div key={t.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{t.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>{t.email} • {t.subject}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>إضافة معلم جديد</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم المعلم</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>البريد الإلكتروني</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>المادة الدراسية</label>
                <input type="text" className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="رياضيات، لغتي، الخ..." required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'students'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'students'), {
        name, email, class: studentClass, role: 'student', createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        email, role: 'student', name
      });
      setIsAdding(false);
      setName(''); setEmail(''); setStudentClass('');
    } catch (err) {
      console.error(err);
      alert('خطأ في الحفظ. تأكد من الصلاحيات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>إدارة الطلاب</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          تسجيل طالب
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {students.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>لا يوجد طلاب مضافين بعد.</p>
        ) : (
          students.map(s => (
            <div key={s.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{s.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>{s.email} • فصل: {s.class}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>تسجيل طالب جديد</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم الطالب</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>البريد الإلكتروني</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفصل الدراسي</label>
                <input type="text" className="input-field" value={studentClass} onChange={e => setStudentClass(e.target.value)} placeholder="مثال: 1/أ" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [className, setClassName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const cls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(cls);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!className) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: className,
        createdAt: new Date()
      });
      setIsAdding(false);
      setClassName('');
    } catch (err) {
      console.error(err);
      alert('خطأ في الحفظ. تأكد من الصلاحيات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>الفصول الدراسية</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          إضافة فصل جديد
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {classes.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>لا توجد فصول مضافة بعد.</p>
        ) : (
          classes.map(cls => (
            <div key={cls.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{cls.name}</h3>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setIsAdding(false)} 
              style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="var(--color-text-muted)" />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
              إضافة فصل دراسي
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم الفصل (مثال: 1/أ)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="اسم الفصل"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ الفصل'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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
