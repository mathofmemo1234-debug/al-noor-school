import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { Calendar, BookOpen, Plus, Trash2, Save, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PrintScheduleModal from '../components/PrintScheduleModal';

export default function ManageSchedules({ schoolId }) {
  const { t } = useLanguage();
  const DAYS = [
    t('manageSchedules.sunday'),
    t('manageSchedules.monday'),
    t('manageSchedules.tuesday'),
    t('manageSchedules.wednesday'),
    t('manageSchedules.thursday')
  ];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [academicYear, setAcademicYear] = useState('1447-1448');
  const [semester, setSemester] = useState(t('manageSchedules.firstSemester'));
  
  // Array of flat schedule entries
  const [entries, setEntries] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [isPrintingSchedule, setIsPrintingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // For managing subjects
  const [newSubject, setNewSubject] = useState('');
  
  // Data loading
  useEffect(() => {
    if (!schoolId) return;

    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qTeachers = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const unsubSubjects = onSnapshot(qSubjects, (snap) => {
      let subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (subs.length === 0) {
        const defaultSubjects = [
          t('manageSchedules.quran'), t('manageSchedules.tafsir'), t('manageSchedules.tawhid'),
          t('manageSchedules.fiqh'), t('manageSchedules.hadith'), t('manageSchedules.arabic'),
          t('manageSchedules.math'), t('manageSchedules.science'), t('manageSchedules.socialStudies'),
          t('manageSchedules.english'), t('manageSchedules.art'), t('manageSchedules.pe')
        ];
        defaultSubjects.forEach(async (sub) => {
          await addDoc(collection(db, 'subjects'), { name: sub, schoolId });
        });
      }
      setSubjects(subs);
    });
    
    // Load existing schedules and flatten them
    const qSchedules = query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
    const unsubSchedules = onSnapshot(qSchedules, (snap) => {
      setSchedulesList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      let flatEntries = [];
      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.academicYear) setAcademicYear(data.academicYear);
        if (data.semester) setSemester(data.semester);
        
        const matrix = data.matrix || {};
        const classId = docSnap.id;
        
        Object.keys(matrix).forEach(key => {
          const [day, periodStr] = key.split('-');
          const cell = matrix[key];
          if (cell && (cell.subject || cell.teacherId)) {
            flatEntries.push({
              id: Math.random().toString(36).substr(2, 9),
              classId,
              day,
              period: parseInt(periodStr),
              subject: cell.subject,
              teacherId: cell.teacherId
            });
          }
        });
      });
      // Sort by day, period, class
      flatEntries.sort((a, b) => {
        if (DAYS.indexOf(a.day) !== DAYS.indexOf(b.day)) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (a.period !== b.period) return a.period - b.period;
        return 0;
      });
      setEntries(flatEntries);
    });

    return () => { unsubClasses(); unsubTeachers(); unsubSubjects(); unsubSchedules(); };
  }, [schoolId]);

  const handleAddRow = () => {
    setEntries([{
      id: Math.random().toString(36).substr(2, 9),
      classId: '',
      day: DAYS[0],
      period: 1,
      subject: '',
      teacherId: ''
    }, ...entries]);
  };

  const handleRemoveRow = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleRowChange = (id, field, value) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      // Group entries by classId
      const grouped = {};
      entries.forEach(entry => {
        if (!entry.classId || !entry.day || !entry.period) return;
        if (!grouped[entry.classId]) grouped[entry.classId] = {};
        
        const key = `${entry.day}-${entry.period}`;
        grouped[entry.classId][key] = {
          subject: entry.subject || '',
          teacherId: entry.teacherId || ''
        };
      });

      // We need to delete old classes that might no longer exist in grouped
      const qSchedules = query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
      const oldSchedulesSnap = await getDocs(qSchedules);
      const batch = writeBatch(db);
      
      oldSchedulesSnap.docs.forEach(docSnap => {
        if (!grouped[docSnap.id]) {
          batch.delete(docSnap.ref);
        }
      });

      // Write new grouped data
      Object.keys(grouped).forEach(classId => {
        const docRef = doc(db, 'schedules', classId);
        batch.set(docRef, {
          classId: classId,
          schoolId,
          academicYear,
          semester,
          matrix: grouped[classId],
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      alert(t('manageSchedules.scheduleSaved'));
    } catch (error) {
      console.error(error);
      alert(t('manageSchedules.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    try {
      await addDoc(collection(db, 'subjects'), { name: newSubject.trim(), schoolId });
      setNewSubject('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm(t('manageSchedules.confirmDeleteSubject'))) return;
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
          <BookOpen size={24} /> {t('manageSchedules.manageSubjectsTitle')}
        </h2>
        <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder={t('manageSchedules.newSubjectPlaceholder')} 
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            style={{ marginBottom: 0, flex: 1, maxWidth: '300px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> {t('manageSchedules.addSubject')}
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
                title={t('manageSchedules.delete')}
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
          <Calendar size={24} /> {t('manageSchedules.manageScheduleTitle')}
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('manageSchedules.academicYear')}</label>
            <select className="input-field" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ marginBottom: 0, width: '150px' }}>
              <option value="1447-1448">1447-1448</option>
              <option value="1448-1449">1448-1449</option>
              <option value="1449-1450">1449-1450</option>
              <option value="1450-1451">1450-1451</option>
              <option value="1451-1452">1451-1452</option>
              <option value="1452-1453">1452-1453</option>
              <option value="1453-1454">1453-1454</option>
              <option value="1454-1455">1454-1455</option>
              <option value="1455-1456">1455-1456</option>
              <option value="1456-1457">1456-1457</option>
              <option value="1457-1458">1457-1458</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>{t('manageSchedules.semester')}</label>
            <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)} style={{ marginBottom: 0, width: '150px' }}>
              <option value={t('manageSchedules.firstSemester')}>{t('manageSchedules.firstSemester')}</option>
              <option value={t('manageSchedules.secondSemester')}>{t('manageSchedules.secondSemester')}</option>
            </select>
          </div>
          <div style={{ flex: 1, textAlign: 'left', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsPrintingSchedule(true)}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                color: 'white',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Printer size={18} /> طباعة وتصدير الجداول (فصل / معلم / عام)
            </button>
            <button onClick={handleAddRow} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> {t('manageSchedules.addNewPeriod')}
            </button>
            <button onClick={handleSaveSchedule} disabled={isSaving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {isSaving ? t('manageSchedules.saving') : t('manageSchedules.saveGeneralSchedule')}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('manageSchedules.teacher')}</th>
                <th>{t('manageSchedules.subject')}</th>
                <th>{t('manageSchedules.class')}</th>
                <th>{t('manageSchedules.day')}</th>
                <th>{t('manageSchedules.period')}</th>
                <th style={{ width: '50px' }}>{t('manageSchedules.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    {t('manageSchedules.noPeriodsAdded')}
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id}>
                  <td>
                    <select className="input-field" value={entry.teacherId} onChange={(e) => handleRowChange(entry.id, 'teacherId', e.target.value)} style={{ marginBottom: 0 }}>
                      <option value="">{t('manageSchedules.selectTeacher')}</option>
                      {teachers.map(tData => <option key={tData.id} value={tData.id}>{tData.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input-field" value={entry.subject} onChange={(e) => handleRowChange(entry.id, 'subject', e.target.value)} style={{ marginBottom: 0 }}>
                      <option value="">{t('manageSchedules.selectSubject')}</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input-field" value={entry.classId} onChange={(e) => handleRowChange(entry.id, 'classId', e.target.value)} style={{ marginBottom: 0 }}>
                      <option value="">{t('manageSchedules.selectClass')}</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input-field" value={entry.day} onChange={(e) => handleRowChange(entry.id, 'day', e.target.value)} style={{ marginBottom: 0 }}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input-field" value={entry.period} onChange={(e) => handleRowChange(entry.id, 'period', parseInt(e.target.value))} style={{ marginBottom: 0 }}>
                      {PERIODS.map(p => <option key={p} value={p}>{t('manageSchedules.periodPrefix')}{p}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleRemoveRow(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}>
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPrintingSchedule && (
        <PrintScheduleModal
          classes={classes}
          teachers={teachers}
          schedules={schedulesList}
          academicYear={academicYear}
          semester={semester}
          onClose={() => setIsPrintingSchedule(false)}
        />
      )}

    </div>
  );
}
