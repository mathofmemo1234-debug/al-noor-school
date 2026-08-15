import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, BookOpen, UserPlus, X, Edit, Trash2 } from 'lucide-react';
import ManageSchedules from './ManageSchedules';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import AdminPreparations from './AdminPreparations';

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
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // Single Add
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Add
  const [bulkData, setBulkData] = useState('');
  
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teachers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    });
    return () => unsub();
  }, []);

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!name || !nationalId) return;
    setIsSaving(true);
    try {
      const fakeEmail = `${nationalId}@school.local`;
      await addDoc(collection(db, 'teachers'), {
        name, nationalId, email: fakeEmail, subject, role: 'teacher', createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        nationalId, email: fakeEmail, role: 'teacher', name
      });
      setIsAdding(false);
      setName(''); setNationalId(''); setSubject('');
    } catch (err) {
      console.error(err);
      alert('خطأ في الحفظ. تأكد من الصلاحيات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (!bulkData.trim()) return;
    setIsSaving(true);
    
    try {
      const lines = bulkData.trim().split('\n');
      for (let line of lines) {
        // Split by comma or tab
        const parts = line.split(/[\t,]/).map(s => s.trim());
        if (parts.length >= 2) {
          const tId = parts[0];
          const tName = parts[1];
          const tSubj = parts[2] || '';
          
          if (tId && tName) {
            const fakeEmail = `${tId}@school.local`;
            await addDoc(collection(db, 'teachers'), {
              name: tName, nationalId: tId, email: fakeEmail, subject: tSubj, role: 'teacher', createdAt: new Date()
            });
            await addDoc(collection(db, 'users'), {
              nationalId: tId, email: fakeEmail, role: 'teacher', name: tName
            });
          }
        }
      }
      setIsBulkAdding(false);
      setBulkData('');
      alert('تم إضافة المعلمين بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الرفع الجماعي.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nationalId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المعلم؟')) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
      const uq = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await deleteDoc(doc(db, 'users', d.id)));
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحذف');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'teachers', editingTeacher.id), {
        name: editingTeacher.name,
        subject: editingTeacher.subject
      });
      const uq = query(collection(db, 'users'), where('nationalId', '==', editingTeacher.nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await updateDoc(doc(db, 'users', d.id), {
        name: editingTeacher.name
      }));
      setEditingTeacher(null);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء التحديث');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>إدارة المعلمين</h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn" style={{background: 'var(--color-surface)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)'}} onClick={() => setIsBulkAdding(true)}>
            رفع جماعي
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            إضافة معلم جديد
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {teachers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>لا يوجد معلمين مضافين بعد.</p>
        ) : (
          teachers.map(t => (
            <div key={t.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{t.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>رقم الهوية: {t.nationalId} • {t.subject}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingTeacher(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit size={20} /></button>
                <button onClick={() => handleDelete(t.id, t.nationalId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={20} /></button>
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
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم المعلم</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>رقم الهوية الوطنية</label>
                <input type="text" className="input-field" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="10xxxxxxxx" required />
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

      {editingTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setEditingTeacher(null)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>تعديل بيانات المعلم</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم المعلم</label>
                <input type="text" className="input-field" value={editingTeacher.name} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>المادة الدراسية</label>
                <input type="text" className="input-field" value={editingTeacher.subject} onChange={e => setEditingTeacher({...editingTeacher, subject: e.target.value})} placeholder="رياضيات، لغتي، الخ..." required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
            </form>
          </div>
        </div>
      )}

      {isBulkAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsBulkAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--color-primary-dark)' }}>الرفع الجماعي للمعلمين</h3>
            <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '15px'}}>
              قم بنسخ ولصق البيانات من ملف إكسل. (كل سطر يمثل معلماً).<br/>
              الترتيب المطلوب: <strong>رقم الهوية، الاسم، المادة</strong> (مفصولة بفاصلة أو مسافة جدولة Tab)
            </p>
            <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <textarea 
                className="input-field" 
                rows="10" 
                value={bulkData} 
                onChange={e => setBulkData(e.target.value)} 
                placeholder="1010101010, أحمد محمد, رياضيات&#10;1020202020, خالد عبدالله, علوم" 
                required 
                style={{resize: 'none'}}
              />
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الرفع...' : 'رفع البيانات'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Single Add
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Add
  const [bulkData, setBulkData] = useState('');

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassesList(data);
    });
    return () => { unsubStudents(); unsubClasses(); };
  }, []);

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!name || !nationalId || !studentClass) return;
    setIsSaving(true);
    try {
      const fakeEmail = `${nationalId}@school.local`;
      await addDoc(collection(db, 'students'), {
        name, nationalId, email: fakeEmail, class: studentClass, role: 'student', createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        nationalId, email: fakeEmail, role: 'student', name
      });
      setIsAdding(false);
      setName(''); setNationalId(''); setStudentClass('');
    } catch (err) {
      console.error(err);
      alert('خطأ في الحفظ. تأكد من الصلاحيات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (!bulkData.trim()) return;
    setIsSaving(true);
    
    try {
      const lines = bulkData.trim().split('\n');
      for (let line of lines) {
        const parts = line.split(/[\t,]/).map(s => s.trim());
        if (parts.length >= 2) {
          const sId = parts[0];
          const sName = parts[1];
          const sClass = parts[2] || '';
          
          if (sId && sName) {
            const fakeEmail = `${sId}@school.local`;
            await addDoc(collection(db, 'students'), {
              name: sName, nationalId: sId, email: fakeEmail, class: sClass, role: 'student', createdAt: new Date()
            });
            await addDoc(collection(db, 'users'), {
              nationalId: sId, email: fakeEmail, role: 'student', name: sName
            });
          }
        }
      }
      setIsBulkAdding(false);
      setBulkData('');
      alert('تم إضافة الطلاب بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الرفع الجماعي.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nationalId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      const uq = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await deleteDoc(doc(db, 'users', d.id)));
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحذف');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        name: editingStudent.name,
        class: editingStudent.class
      });
      const uq = query(collection(db, 'users'), where('nationalId', '==', editingStudent.nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await updateDoc(doc(db, 'users', d.id), {
        name: editingStudent.name
      }));
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء التحديث');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>إدارة الطلاب</h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn" style={{background: 'var(--color-surface)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)'}} onClick={() => setIsBulkAdding(true)}>
            رفع جماعي
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            تسجيل طالب
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {students.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>لا يوجد طلاب مضافين بعد.</p>
        ) : (
          students.map(s => (
            <div key={s.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{s.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>رقم الهوية: {s.nationalId} • فصل: {s.class}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingStudent(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit size={20} /></button>
                <button onClick={() => handleDelete(s.id, s.nationalId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={20} /></button>
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
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم الطالب</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>رقم الهوية الوطنية</label>
                <input type="text" className="input-field" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="10xxxxxxxx" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفصل الدراسي</label>
                <select className="input-field" value={studentClass} onChange={e => setStudentClass(e.target.value)} required>
                  <option value="">اختر الفصل...</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}</button>
            </form>
          </div>
        </div>
      )}

      {editingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setEditingStudent(null)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>تعديل بيانات الطالب</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم الطالب</label>
                <input type="text" className="input-field" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} placeholder="الاسم الرباعي" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفصل الدراسي</label>
                <select className="input-field" value={editingStudent.class} onChange={e => setEditingStudent({...editingStudent, class: e.target.value})} required>
                  <option value="">اختر الفصل...</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
            </form>
          </div>
        </div>
      )}

      {isBulkAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsBulkAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--color-primary-dark)' }}>الرفع الجماعي للطلاب</h3>
            <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '15px'}}>
              قم بنسخ ولصق البيانات من ملف إكسل. (كل سطر يمثل طالباً).<br/>
              الترتيب المطلوب: <strong>رقم الهوية، الاسم، الفصل</strong> (مفصولة بفاصلة أو مسافة جدولة Tab)
            </p>
            <form onSubmit={handleSaveBulk} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <textarea 
                className="input-field" 
                rows="10" 
                value={bulkData} 
                onChange={e => setBulkData(e.target.value)} 
                placeholder="1010101010, أحمد محمد, 1/أ&#10;1020202020, خالد عبدالله, 2/ب" 
                required 
                style={{resize: 'none'}}
              />
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'جاري الرفع...' : 'رفع البيانات'}</button>
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
  const [editingClass, setEditingClass] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفصل؟')) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء الحذف');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'classes', editingClass.id), {
        name: editingClass.name
      });
      setEditingClass(null);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء التحديث');
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
            <div key={cls.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{cls.name}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingClass(cls)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit size={20} /></button>
                <button onClick={() => handleDelete(cls.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={20} /></button>
              </div>
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

      {editingClass && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setEditingClass(null)} 
              style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="var(--color-text-muted)" />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
              تعديل بيانات الفصل
            </h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>اسم الفصل</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
        <Route path="/schedule" element={<ManageSchedules />} />
        <Route path="/preparations" element={<AdminPreparations />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </Layout>
  );
}
