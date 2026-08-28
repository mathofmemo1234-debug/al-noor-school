import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { Calendar, BookOpen, Plus, Trash2, Save, Printer, ShieldCheck, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SAUDI_CURRICULUM_STRICT } from '../data/saudiCurriculumData';
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
  const [isCleaning, setIsCleaning] = useState(false);
  
  // For managing custom subjects
  const [newSubject, setNewSubject] = useState('');

  // Extract all official protected core subjects directly from verified curriculum
  const officialCoreSubjects = useMemo(() => {
    const list = [];
    if (!SAUDI_CURRICULUM_STRICT) return list;
    Object.entries(SAUDI_CURRICULUM_STRICT).forEach(([stage, semesters]) => {
      Object.entries(semesters || {}).forEach(([semName, subjectObj]) => {
        Object.entries(subjectObj || {}).forEach(([subjName, lessonsList]) => {
          if (Array.isArray(lessonsList) && lessonsList.length > 0) {
            const sample = lessonsList[0];
            list.push({
              name: subjName,
              stage,
              semester: semName,
              grade: sample.grade || 'محدد بالمنهج',
              lessonCount: lessonsList.length
            });
          }
        });
      });
    });
    return list;
  }, []);
  
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

    const LEGACY_MOCK_SUBJECTS = new Set([
      'القرآن الكريم', 'التفسير', 'التوحيد', 'الفقه', 'الحديث', 'لغتي', 'اللغة العربية',
      'الرياضيات', 'العلوم', 'العلوم الطبيعية', 'الدراسات الاجتماعية', 'الاجتماعيات',
      'اللغة الإنجليزية', 'التربية الفنية', 'التربية البدنية', 'كيمياء', 'فيزياء', 'أحياء'
    ]);

    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const unsubSubjects = onSnapshot(qSubjects, async (snap) => {
      // Clean legacy mock documents from Firestore
      const legacyDocs = snap.docs.filter(docSnap => {
        const name = docSnap.data()?.name?.trim();
        return LEGACY_MOCK_SUBJECTS.has(name);
      });

      if (legacyDocs.length > 0) {
        const batch = writeBatch(db);
        legacyDocs.forEach(d => batch.delete(d.ref));
        try {
          await batch.commit();
        } catch (e) {
          console.error("Auto-cleanup error:", e);
        }
      }

      const subs = snap.docs
        .filter(docSnap => !LEGACY_MOCK_SUBJECTS.has(docSnap.data()?.name?.trim()))
        .map(doc => ({ id: doc.id, ...doc.data() }));
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

  // Clean legacy temporary / duplicate mock subjects from database
  const handleCleanLegacySubjects = async () => {
    if (!window.confirm('هل أنت متأكد من حذف المواد التقديرية المؤقتة السابقة وتحديث قائمة المواد الأساسية المعتمدة؟')) return;
    setIsCleaning(true);
    try {
      const q = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      alert('تم تنظيف كافة المواد التقديرية بنجاح! المواد الأساسية الرسمية المعتمدة فقط هي المثبتة الآن.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تنظيف المواد');
    } finally {
      setIsCleaning(false);
    }
  };

  // Filter and deduplicate custom subjects (excluding any that match core subject names)
  const customSubjects = useMemo(() => {
    const seen = new Set();
    return subjects.filter(sub => {
      const name = sub?.name?.trim();
      if (!name) return false;
      if (officialCoreSubjects.some(core => core.name.trim() === name)) return false;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [subjects, officialCoreSubjects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Subjects Management */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-dark)', margin: 0 }}>
            <BookOpen size={24} /> {t('manageSchedules.manageSubjectsTitle')}
          </h2>

          {subjects.length > 0 && (
            <button
              type="button"
              onClick={handleCleanLegacySubjects}
              disabled={isCleaning}
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="إزالة المواد التقديرية السابقة المخزنة بالمدرسة"
            >
              <Trash2 size={15} />
              {isCleaning ? 'جارٍ التنظيف...' : '🧹 تنظيف المواد التقديرية السابقة'}
            </button>
          )}
        </div>

        {/* 1. Core Official Subjects Section (Non-deletable & Protected) */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa, #eff6ff)',
          border: '1px solid #99f6e4',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 'bold', color: '#0f766e', fontSize: '14px' }}>
            <ShieldCheck size={18} color="#0d9488" /> المواد الأساسية المعتمدة (المنهج الرسمي - لا يمكن حذفها نهائياً):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {officialCoreSubjects.map((core, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'white',
                  border: '1px solid #0d9488',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.08)'
                }}
              >
                <Lock size={14} color="#0d9488" />
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>
                  {core.name}
                </span>
                <span style={{ 
                  background: '#ccfbf1', 
                  color: '#0f766e', 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  padding: '2px 8px', 
                  borderRadius: '6px' 
                }}>
                  {core.grade}
                </span>
                <span style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  {core.lessonCount} درساً معتمداً
                </span>
              </div>
            ))}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#0d9488' }}>
            🔒 يتم تثبيت هذه المواد تلقائياً من المنهج المعتمد لوزارة التعليم وتسند فورياً للصفوف المختصة مع كامل دروسها وأهدافها.
          </p>
        </div>

        {/* 2. Custom School Subjects Section */}
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
            إضافة مادة مخصصة أو إضافية للمدرسة:
          </label>
          <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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
          
          {customSubjects.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {customSubjects.map(sub => (
                <div key={sub.id} style={{ 
                  background: 'white', padding: '6px 14px', borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{sub.name}</span>
                  <button 
                    onClick={() => handleDeleteSubject(sub.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    title={t('manageSchedules.delete')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
                      
                      {officialCoreSubjects.length > 0 && (
                        <optgroup label="🔒 المواد الأساسية المعتمدة">
                          {officialCoreSubjects.map(c => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.grade})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {customSubjects.length > 0 && (
                        <optgroup label="📋 المواد الإضافية">
                          {customSubjects.map(s => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
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
