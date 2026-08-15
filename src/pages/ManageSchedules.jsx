import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Calendar, BookOpen, Plus, Trash2, Save } from 'lucide-react';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function ManageSchedules() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [academicYear, setAcademicYear] = useState('1445-1446');
  const [semester, setSemester] = useState('الفصل الأول');
  const [scheduleData, setScheduleData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // For managing subjects
  const [newSubject, setNewSubject] = useState('');
  
  // Data loading
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snap) => {
      let subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Prepopulate if empty
      if (subs.length === 0) {
        const defaultSubjects = ['القرآن الكريم', 'التوحيد', 'الفقه', 'الحديث', 'لغتي', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الدراسات الاجتماعية', 'التربية الفنية', 'التربية البدنية', 'المهارات الرقمية'];
        defaultSubjects.forEach(async (sub) => {
          await addDoc(collection(db, 'subjects'), { name: sub });
        });
      }
      setSubjects(subs);
    });

    return () => { unsubClasses(); unsubTeachers(); unsubSubjects(); };
  }, []);

  // Load selected class schedule
  useEffect(() => {
    if (!selectedClass) {
      setScheduleData({});
      return;
    }
    
    // We store schedule as doc with ID = classId
    const unsubSchedule = onSnapshot(doc(db, 'schedules', selectedClass), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScheduleData(data.matrix || {});
        if (data.academicYear) setAcademicYear(data.academicYear);
        if (data.semester) setSemester(data.semester);
      } else {
        setScheduleData({});
      }
    });
    return () => unsubSchedule();
  }, [selectedClass]);

  const handleCellChange = (day, period, field, value) => {
    const key = `${day}-${period}`;
    setScheduleData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedClass) return alert('الرجاء اختيار الفصل');
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'schedules', selectedClass), {
        classId: selectedClass,
        academicYear,
        semester,
        matrix: scheduleData,
        updatedAt: new Date().toISOString()
      });
      alert('تم حفظ الجدول بنجاح');
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء حفظ الجدول');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await addDoc(collection(db, 'subjects'), { name: newSubject.trim() });
      setNewSubject('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Subjects Management */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
          <BookOpen size={24} /> إدارة المواد الدراسية
        </h2>
        <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="اسم المادة الجديدة..." 
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> إضافة مادة
          </button>
        </form>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {subjects.map(sub => (
            <div key={sub.id} style={{ 
              background: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: '20px', 
              display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <span>{sub.name}</span>
              <button 
                onClick={() => handleDeleteSubject(sub.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: 0, display: 'flex' }}
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Management */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--color-primary-dark)' }}>
          <Calendar size={24} /> إدارة جدول الحصص
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفصل الدراسي</label>
            <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ marginBottom: 0, minWidth: '200px' }}>
              <option value="">-- اختر الفصل --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>العام الدراسي</label>
            <input type="text" className="input-field" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ marginBottom: 0, width: '150px' }} placeholder="مثال: 1445-1446" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>الفصل (الترم)</label>
            <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)} style={{ marginBottom: 0, width: '150px' }}>
              <option value="الفصل الأول">الفصل الأول</option>
              <option value="الفصل الثاني">الفصل الثاني</option>
              <option value="الفصل الثالث">الفصل الثالث</option>
            </select>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <button onClick={handleSaveSchedule} disabled={!selectedClass || isSaving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ الجدول'}
            </button>
          </div>
        </div>

        {selectedClass ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>اليوم</th>
                  {PERIODS.map(p => <th key={p} style={{ textAlign: 'center' }}>الحصة {p}</th>)}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{day}</td>
                    {PERIODS.map(period => {
                      const key = `${day}-${period}`;
                      const cellData = scheduleData[key] || { subject: '', teacherId: '' };
                      return (
                        <td key={period} style={{ padding: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <select 
                              className="input-field" 
                              style={{ padding: '4px 8px', fontSize: '12px', marginBottom: 0, height: 'auto' }}
                              value={cellData.subject}
                              onChange={(e) => handleCellChange(day, period, 'subject', e.target.value)}
                            >
                              <option value="">المادة...</option>
                              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <select 
                              className="input-field" 
                              style={{ padding: '4px 8px', fontSize: '12px', marginBottom: 0, height: 'auto' }}
                              value={cellData.teacherId}
                              onChange={(e) => handleCellChange(day, period, 'teacherId', e.target.value)}
                            >
                              <option value="">المعلم...</option>
                              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            يرجى اختيار الفصل لعرض وتعديل جدوله الدراسي
          </div>
        )}
      </div>

    </div>
  );
}
