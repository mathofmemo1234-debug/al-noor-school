import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, BookOpen, UserPlus, X, Edit, Trash2 } from 'lucide-react';
import ManageSchedules from './ManageSchedules';
import { db } from '../firebase';
import { collection, addDoc, setDoc, onSnapshot, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import AdminPreparations from './AdminPreparations';
import WeeklyPlanView from '../components/WeeklyPlanView';
import SchoolSettings from './SchoolSettings';
import AdminExcellence from './AdminExcellence';
import { useLanguage } from '../contexts/LanguageContext';

function AdminHome({ schoolId }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });

  useEffect(() => {
    if (!schoolId) return;
    const qTeachers = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));

    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      setStats(prev => ({ ...prev, teachers: snap.size }));
    });
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStats(prev => ({ ...prev, students: snap.size }));
    });
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setStats(prev => ({ ...prev, classes: snap.size }));
    });
    return () => { unsubTeachers(); unsubStudents(); unsubClasses(); };
  }, [schoolId]);

  const handleSeedData = async () => {
    try {
      alert(t('adminDashboard.addingData'));
      
      const teacherIds = [];
      const teachers = [
        { name: "محمد أحمد", subject: "رياضيات" },
        { name: "خالد عبدالله", subject: "لغتي" },
        { name: "سعد محمد", subject: "علوم" },
        { name: "علي حسن", subject: "إنجليزي" },
        { name: "عمر فهد", subject: "فيزياء" }
      ];
      for (let i = 0; i < 5; i++) {
        const nid = `100000000${i+1}`;
        const email = `${nid}@school.local`;
        const docRef = await addDoc(collection(db, 'teachers'), {
          name: teachers[i].name, nationalId: nid, email, subject: teachers[i].subject, role: 'teacher', schoolId, createdAt: new Date()
        });
        teacherIds.push(docRef.id);
        await addDoc(collection(db, 'users'), {
          nationalId: nid, email, role: 'teacher', name: teachers[i].name, schoolId
        });
      }

      const classNames = ["أول متوسط", "ثاني متوسط", "ثالث متوسط", "أول ثانوي", "ثاني ثانوي", "ثالث ثانوي"];
      const studentNames = ["أحمد سعيد", "عبدالرحمن سعد", "ياسر علي", "فارس فهد", "سلمان محمد"];
      for (let i = 0; i < 5; i++) {
        const nid = `200000000${i+1}`;
        const email = `${nid}@school.local`;
        const assignedClass = classNames[i % classNames.length];
        await addDoc(collection(db, 'students'), {
          name: studentNames[i], nationalId: nid, email, className: assignedClass, role: 'student', schoolId, createdAt: new Date()
        });
        await addDoc(collection(db, 'users'), {
          nationalId: nid, email, role: 'student', name: studentNames[i], schoolId
        });
      }

      const classDocs = [];
      for (let cName of classNames) {
        const docRef = await addDoc(collection(db, 'classes'), {
          name: cName, level: 'test', schoolId, createdAt: new Date()
        });
        classDocs.push({ id: docRef.id, name: cName });
      }

      // Assign schedule for the first 3 classes to show teachers teaching multiple classes
      const targetClasses = classDocs.slice(0, 3);
      for (let targetClass of targetClasses) {
        const matrix = {};
        matrix["الأحد-1"] = { subject: "رياضيات", teacherId: teacherIds[0] };
        matrix["الأحد-2"] = { subject: "لغتي", teacherId: teacherIds[1] };
        matrix["الإثنين-1"] = { subject: "علوم", teacherId: teacherIds[2] };
        matrix["الثلاثاء-3"] = { subject: "إنجليزي", teacherId: teacherIds[3] };
        matrix["الأربعاء-4"] = { subject: "فيزياء", teacherId: teacherIds[4] };
        
        await setDoc(doc(db, 'schedules', targetClass.id), {
          className: targetClass.name,
          schoolId,
          matrix
        });
      }

      alert(t('adminDashboard.seedSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.errorPrefix') + err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleSeedData} className="btn btn-primary">
          {t('adminDashboard.addSeedData')}
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon blue">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>{t('adminDashboard.totalTeachers')}</p>
            <h3>{stats.teachers}</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon green">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <p>{t('adminDashboard.totalStudents')}</p>
            <h3>{stats.students}</h3>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon orange">
            <BookOpen size={32} />
          </div>
          <div className="stat-info">
            <p>{t('adminDashboard.totalClasses')}</p>
            <h3>{stats.classes}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageTeachers({ schoolId }) {
  const { t } = useLanguage();
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
    if (!schoolId) return;
    const q = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    });
    return () => unsub();
  }, [schoolId]);

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!name || !nationalId) return;
    setIsSaving(true);
    try {
      const fakeEmail = `${nationalId}@school.local`;
      await addDoc(collection(db, 'teachers'), {
        name, nationalId, email: fakeEmail, subject, role: 'teacher', schoolId, createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        nationalId, email: fakeEmail, role: 'teacher', name, schoolId
      });
      setIsAdding(false);
      setName(''); setNationalId(''); setSubject('');
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.saveError'));
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
              name: tName, nationalId: tId, email: fakeEmail, subject: tSubj, role: 'teacher', schoolId, createdAt: new Date()
            });
            await addDoc(collection(db, 'users'), {
              nationalId: tId, email: fakeEmail, role: 'teacher', name: tName, schoolId
            });
          }
        }
      }
      setIsBulkAdding(false);
      setBulkData('');
      alert(t('adminDashboard.teachersAddedSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.bulkUploadError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nationalId) => {
    if (!window.confirm(t('adminDashboard.confirmDeleteTeacher'))) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
      const uq = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await deleteDoc(doc(db, 'users', d.id)));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.deleteError'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'teachers', editingTeacher.id), {
        name: editingTeacher.name,
        subject: editingTeacher.subject,
        whatsapp: editingTeacher.whatsapp || ''
      });
      const uq = query(collection(db, 'users'), where('nationalId', '==', editingTeacher.nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await updateDoc(doc(db, 'users', d.id), {
        name: editingTeacher.name
      }));
      setEditingTeacher(null);
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('adminDashboard.manageTeachersTitle')}</h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn" style={{background: 'var(--color-surface)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)'}} onClick={() => setIsBulkAdding(true)}>
            {t('adminDashboard.bulkUpload')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            {t('adminDashboard.addNewTeacher')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {teachers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('adminDashboard.noTeachersAdded')}</p>
        ) : (
          teachers.map(tData => (
            <div key={tData.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{tData.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.nationalIdLabel')}{tData.nationalId} • {tData.subject} {tData.whatsapp ? `${t('adminDashboard.whatsappLabel')}${tData.whatsapp}` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingTeacher(tData)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}><Edit size={20} /></button>
                <button onClick={() => handleDelete(tData.id, tData.nationalId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={20} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.addNewTeacher')}</h3>
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.teacherName')}</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder={t('adminDashboard.fullNamePlaceholder')} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.nationalId')}</label>
                <input type="text" className="input-field" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="10xxxxxxxx" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.subject')}</label>
                <input type="text" className="input-field" value={subject} onChange={e => setSubject(e.target.value)} placeholder={t('adminDashboard.subjectPlaceholder')} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveData')}</button>
            </form>
          </div>
        </div>
      )}

      {editingTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setEditingTeacher(null)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.editTeacherTitle')}</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.teacherName')}</label>
                <input type="text" className="input-field" value={editingTeacher.name} onChange={e => setEditingTeacher({...editingTeacher, name: e.target.value})} placeholder={t('adminDashboard.fullNamePlaceholder')} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.subject')}</label>
                <input type="text" className="input-field" value={editingTeacher.subject} onChange={e => setEditingTeacher({...editingTeacher, subject: e.target.value})} placeholder={t('adminDashboard.subjectPlaceholder')} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.whatsappOptional')}</label>
                <input type="text" className="input-field" value={editingTeacher.whatsapp || ''} onChange={e => setEditingTeacher({...editingTeacher, whatsapp: e.target.value})} placeholder={t('adminDashboard.whatsappPlaceholder')} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveChanges')}</button>
            </form>
          </div>
        </div>
      )}

      {isBulkAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsBulkAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.bulkUploadTeachersTitle')}</h3>
            <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '15px'}}>
              {t('adminDashboard.bulkUploadTeachersInstruction1')}<br/>
              {t('adminDashboard.requiredOrder')}<strong>{t('adminDashboard.idNameSubject')}</strong>{t('adminDashboard.separatedByCommaOrTab')}
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
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.uploading') : t('adminDashboard.uploadData')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageStudents({ schoolId }) {
  const { t } = useLanguage();
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
    if (!schoolId) return;
    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));

    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassesList(data);
    });
    return () => { unsubStudents(); unsubClasses(); };
  }, [schoolId]);

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!name || !nationalId || !studentClass) return;
    setIsSaving(true);
    try {
      const fakeEmail = `${nationalId}@school.local`;
      await addDoc(collection(db, 'students'), {
        name, nationalId, email: fakeEmail, class: studentClass, role: 'student', schoolId, createdAt: new Date()
      });
      await addDoc(collection(db, 'users'), {
        nationalId, email: fakeEmail, role: 'student', name, schoolId
      });
      setIsAdding(false);
      setName(''); setNationalId(''); setStudentClass('');
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.saveError'));
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
              name: sName, nationalId: sId, email: fakeEmail, class: sClass, role: 'student', schoolId, createdAt: new Date()
            });
            await addDoc(collection(db, 'users'), {
              nationalId: sId, email: fakeEmail, role: 'student', name: sName, schoolId
            });
          }
        }
      }
      setIsBulkAdding(false);
      setBulkData('');
      alert(t('adminDashboard.studentsAddedSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.bulkUploadError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, nationalId) => {
    if (!window.confirm(t('adminDashboard.confirmDeleteStudent'))) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      const uq = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const snap = await getDocs(uq);
      snap.forEach(async (d) => await deleteDoc(doc(db, 'users', d.id)));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.deleteError'));
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
      alert(t('adminDashboard.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('adminDashboard.manageStudentsTitle')}</h2>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className="btn" style={{background: 'var(--color-surface)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)'}} onClick={() => setIsBulkAdding(true)}>
            {t('adminDashboard.bulkUpload')}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            {t('adminDashboard.registerStudent')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {students.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('adminDashboard.noStudentsAdded')}</p>
        ) : (
          students.map(s => (
            <div key={s.id} style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{s.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.nationalIdLabel')}{s.nationalId}{t('adminDashboard.classLabel')}{s.class}</p>
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
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.registerNewStudentTitle')}</h3>
            <form onSubmit={handleSaveSingle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.studentName')}</label>
                <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder={t('adminDashboard.fullNamePlaceholder')} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.nationalId')}</label>
                <input type="text" className="input-field" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="10xxxxxxxx" required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.class')}</label>
                <select className="input-field" value={studentClass} onChange={e => setStudentClass(e.target.value)} required>
                  <option value="">{t('adminDashboard.selectClass')}</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveData')}</button>
            </form>
          </div>
        </div>
      )}

      {editingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setEditingStudent(null)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.editStudentTitle')}</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.studentName')}</label>
                <input type="text" className="input-field" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} placeholder={t('adminDashboard.fullNamePlaceholder')} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.class')}</label>
                <select className="input-field" value={editingStudent.class} onChange={e => setEditingStudent({...editingStudent, class: e.target.value})} required>
                  <option value="">{t('adminDashboard.selectClass')}</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveChanges')}</button>
            </form>
          </div>
        </div>
      )}

      {isBulkAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsBulkAdding(false)} style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--color-text-muted)" /></button>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'var(--color-primary-dark)' }}>{t('adminDashboard.bulkUploadStudentsTitle')}</h3>
            <p style={{fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '15px'}}>
              {t('adminDashboard.bulkUploadStudentsInstruction1')}<br/>
              {t('adminDashboard.requiredOrder')}<strong>{t('adminDashboard.idNameClass')}</strong>{t('adminDashboard.separatedByCommaOrTab')}
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
              <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? t('adminDashboard.uploading') : t('adminDashboard.uploadData')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageClasses({ schoolId }) {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [className, setClassName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      const cls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(cls);
    });
    return () => unsub();
  }, [schoolId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!className) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: className,
        schoolId,
        createdAt: new Date()
      });
      setIsAdding(false);
      setClassName('');
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('adminDashboard.confirmDeleteClass'))) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (err) {
      console.error(err);
      alert(t('adminDashboard.deleteError'));
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
      alert(t('adminDashboard.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('adminDashboard.totalClasses')}</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          {t('adminDashboard.addNewClass')}
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {classes.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('adminDashboard.noClassesAdded')}</p>
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
              {t('adminDashboard.addClassTitle')}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.classNamePlaceholderLabel')}</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={t('adminDashboard.className')}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveClass')}
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
              {t('adminDashboard.editClassTitle')}
            </h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('adminDashboard.className')}</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? t('adminDashboard.saving') : t('adminDashboard.saveChanges')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { userData } = useAuth();
  const { t } = useLanguage();
  return (
    <Layout role="admin" title={t('adminDashboard.adminDashboardTitle')}>
      <Routes>
        <Route path="/" element={<AdminHome schoolId={userData?.schoolId} />} />
        <Route path="/teachers" element={<ManageTeachers schoolId={userData?.schoolId} />} />
        <Route path="/students" element={<ManageStudents schoolId={userData?.schoolId} />} />
        <Route path="/classes" element={<ManageClasses schoolId={userData?.schoolId} />} />
        <Route path="/schedule" element={<ManageSchedules schoolId={userData?.schoolId} />} />
        <Route path="/preparations" element={<AdminPreparations schoolId={userData?.schoolId} />} />
        <Route path="/weekly-plan" element={<WeeklyPlanView schoolId={userData?.schoolId} />} />
        <Route path="/excellence" element={<AdminExcellence schoolId={userData?.schoolId} />} />
        <Route path="/settings" element={<SchoolSettings schoolId={userData?.schoolId} />} />
        <Route path="*" element={<AdminHome schoolId={userData?.schoolId} />} />
      </Routes>
    </Layout>
  );
}
