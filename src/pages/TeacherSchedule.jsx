import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, setDoc, deleteField } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Link as LinkIcon, Edit2, X, Check, Printer, Plus, 
  Trash2, AlertTriangle, BookOpen, Layers
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PrintScheduleModal from '../components/PrintScheduleModal';
import { getSubjectColorTheme } from '../data/subjectThemes';
import { SAUDI_CURRICULUM_STRICT } from '../data/saudiCurriculumData';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const dayMap = {
  'الأحد': 'sunday',
  'الإثنين': 'monday',
  'الثلاثاء': 'tuesday',
  'الأربعاء': 'wednesday',
  'الخميس': 'thursday'
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherSchedule() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState({});
  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [teacherDocId, setTeacherDocId] = useState(null);
  const [isPrintingSchedule, setIsPrintingSchedule] = useState(false);

  // Link Editing State
  const [editingCell, setEditingCell] = useState(null); // { scheduleId, key, currentLink }
  const [linkInput, setLinkInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Teacher Schedule Edit Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ day: DAYS[0], period: 1 });
  const [slotClassId, setSlotClassId] = useState('');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotLink, setSlotLink] = useState('');
  const [existingCellData, setExistingCellData] = useState(null);
  const [customSubjects, setCustomSubjects] = useState([]);

  useEffect(() => {
    if (userData?.nationalId) {
      const unsubTeacher = onSnapshot(
        query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId)),
        (snap) => {
          if (!snap.empty) {
            setTeacherDocId(snap.docs[0].id);
          } else if (!isNaN(userData.nationalId)) {
            const numQ = query(collection(db, 'teachers'), where('nationalId', '==', Number(userData.nationalId)));
            getDocs(numQ).then(numSnap => {
              if (!numSnap.empty) setTeacherDocId(numSnap.docs[0].id);
              else setTeacherDocId(null);
            });
          } else {
            setTeacherDocId(null);
          }
        }
      );
      return () => unsubTeacher();
    }
  }, [userData]);

  useEffect(() => {
    const schoolId = userData?.schoolId || 'default_school_1';

    // Load classes
    const qClasses = schoolId === 'ALL'
      ? collection(db, 'classes')
      : query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      const clsMap = {};
      const list = [];
      snap.docs.forEach(doc => {
        clsMap[doc.id] = doc.data().name;
        list.push({ id: doc.id, ...doc.data() });
      });
      setClasses(clsMap);
      setClassesList(list);
    });

    // Load teachers
    const qTeachers = schoolId === 'ALL'
      ? collection(db, 'teachers')
      : query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      setTeachersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load custom subjects
    const qSubjects = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const unsubSubjects = onSnapshot(qSubjects, (snap) => {
      setCustomSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Load schedules
    const qSchedules = schoolId === 'ALL'
      ? collection(db, 'schedules')
      : query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
    const unsubSchedules = onSnapshot(qSchedules, (snap) => {
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubClasses(); unsubTeachers(); unsubSubjects(); unsubSchedules(); };
  }, [userData?.schoolId]);

  // Filter schedule for this teacher
  const getTeacherCell = (day, period) => {
    const tid = teacherDocId;
    const nid = userData?.nationalId;
    if (!tid && !nid) return null;
    const key = `${day}-${period}`;
    let result = null;
    
    for (const schedule of schedules) {
      if (schedule.matrix && schedule.matrix[key]) {
        const cellTeacherId = schedule.matrix[key].teacherId;
        if (cellTeacherId && (cellTeacherId === tid || cellTeacherId === nid)) {
          result = {
            scheduleId: schedule.id, // class doc id
            key: key,
            subject: schedule.matrix[key].subject,
            className: classes[schedule.id] || schedule.className || t('teacherSchedule.unknownClass'),
            virtualLink: schedule.matrix[key].virtualLink || ''
          };
          break;
        }
      }
    }
    return result;
  };

  const handleOpenSlotModal = (day, period) => {
    const cell = getTeacherCell(day, period);
    setSelectedSlot({ day, period });
    setExistingCellData(cell);
    if (cell) {
      setSlotClassId(cell.scheduleId);
      setSlotSubject(cell.subject || '');
      setSlotLink(cell.virtualLink || '');
    } else {
      setSlotClassId(classesList[0]?.id || '');
      setSlotSubject(userData?.subject || '');
      setSlotLink('');
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!slotClassId) {
      alert('يرجى اختيار الفصل الدراسي');
      return;
    }

    const tid = teacherDocId || userData?.nationalId || userData?.uid;
    const key = `${selectedSlot.day}-${selectedSlot.period}`;
    setIsSaving(true);

    try {
      // If updating from a previous class, clear old slot first
      if (existingCellData && existingCellData.scheduleId !== slotClassId) {
        const oldRef = doc(db, 'schedules', existingCellData.scheduleId);
        await updateDoc(oldRef, {
          [`matrix.${key}`]: deleteField()
        });
      }

      // Set new slot in selected class schedule
      const targetRef = doc(db, 'schedules', slotClassId);
      await setDoc(targetRef, {
        classId: slotClassId,
        schoolId: userData?.schoolId || 'default_school_1',
        updatedAt: new Date().toISOString(),
        matrix: {
          [key]: {
            subject: slotSubject.trim(),
            teacherId: tid,
            virtualLink: slotLink.trim()
          }
        }
      }, { merge: true });

      setIsSlotModalOpen(false);
      alert('✓ تم تحديث الحصة في جدولك وجدول الفصل بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الحصة في الجدول');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!existingCellData) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إزالة هذه الحصة من جدولك؟')) return;

    setIsSaving(true);
    try {
      const targetRef = doc(db, 'schedules', existingCellData.scheduleId);
      await updateDoc(targetRef, {
        [`matrix.${existingCellData.key}`]: deleteField()
      });
      setIsSlotModalOpen(false);
      alert('✓ تم إزالة الحصة من جدولك بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إزالة الحصة');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLink = async () => {
    if (!editingCell) return;
    setIsSaving(true);
    try {
      const scheduleRef = doc(db, 'schedules', editingCell.scheduleId);
      await updateDoc(scheduleRef, {
        [`matrix.${editingCell.key}.virtualLink`]: linkInput
      });
      setEditingCell(null);
      setLinkInput('');
    } catch (err) {
      console.error(err);
      alert(t('teacherSchedule.saveLinkFail'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--color-primary-dark)' }}>
            <Calendar size={24} /> {t('teacherSchedule.mySchedule')}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            يمكنك النقر على أي حصة لوضعها أو تعديلها أو إضافة رابط الدرس الافتراضي مباشرة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleOpenSlotModal(DAYS[0], 1)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={16} /> إضافة / تعديل حصة في جدولي
          </button>

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
            <Printer size={18} /> طباعة جدولي الدراسي
          </button>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>{t('teacherSchedule.day')}</th>
              {PERIODS.map(p => <th key={p} style={{ textAlign: 'center' }}>{t('teacherSchedule.period')} {p}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{t(`days.${dayMap[day]}`)}</td>
                {PERIODS.map(period => {
                  const cell = getTeacherCell(day, period);
                  const theme = cell ? getSubjectColorTheme(cell.subject) : null;
                  return (
                    <td key={period} style={{ padding: '8px', textAlign: 'center', height: '110px', verticalAlign: 'top' }}>
                      {cell ? (
                        <div 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '4px', 
                            background: theme.bg, 
                            border: `1px solid ${theme.border}`,
                            padding: '8px', 
                            borderRadius: '10px', 
                            height: '100%', 
                            position: 'relative',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: theme.text, fontSize: '13px' }}>
                              {cell.subject}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenSlotModal(day, period)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text, padding: 0 }}
                              title="تعديل الحصة"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>

                          <span style={{ fontSize: '11px', color: theme.badgeText, background: theme.badgeBg, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', width: 'fit-content' }}>
                            {cell.className}
                          </span>
                          
                          {/* Virtual Link Section */}
                          <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                            {editingCell && editingCell.scheduleId === cell.scheduleId && editingCell.key === cell.key ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input 
                                  type="url" 
                                  value={linkInput} 
                                  onChange={e => setLinkInput(e.target.value)} 
                                  placeholder={t('teacherSchedule.platformLink')}
                                  style={{ width: '100%', padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button onClick={handleSaveLink} disabled={isSaving} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}><Check size={12}/></button>
                                  <button onClick={() => setEditingCell(null)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}><X size={12}/></button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {cell.virtualLink ? (
                                  <a href={cell.virtualLink} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
                                    <LinkIcon size={12} /> {t('teacherSchedule.lessonLink')}
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{t('teacherSchedule.noLink')}</span>
                                )}
                                <button 
                                  onClick={() => {
                                    setEditingCell({ scheduleId: cell.scheduleId, key: cell.key });
                                    setLinkInput(cell.virtualLink);
                                  }} 
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                                  title={t('teacherSchedule.addEditLink')}
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleOpenSlotModal(day, period)}
                          style={{ 
                            color: '#94a3b8', 
                            fontSize: '12px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%', 
                            cursor: 'pointer',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            gap: '4px'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(14, 116, 144, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title="انقر لإسناد حصة لجدولك"
                        >
                          <Plus size={14} color="#94a3b8" />
                          <span style={{ fontSize: '10px' }}>إسناد حصة</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Teacher Add/Edit Period Slot */}
      {isSlotModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div className="glass-panel" style={{ background: 'white', maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
                <Calendar size={20} color="#0d9488" /> {existingCellData ? 'تعديل الحصة في جدولي' : 'إضافة حصة لجدولي'}
              </h3>
              <button onClick={() => setIsSlotModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>اليوم</label>
                  <select
                    className="input-field"
                    value={selectedSlot.day}
                    onChange={e => setSelectedSlot({ ...selectedSlot, day: e.target.value })}
                    style={{ marginBottom: 0 }}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>الحصة</label>
                  <select
                    className="input-field"
                    value={selectedSlot.period}
                    onChange={e => setSelectedSlot({ ...selectedSlot, period: parseInt(e.target.value) })}
                    style={{ marginBottom: 0 }}
                  >
                    {PERIODS.map(p => <option key={p} value={p}>الحصة {p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>الفصل الدراسي *</label>
                <select
                  required
                  className="input-field"
                  value={slotClassId}
                  onChange={e => setSlotClassId(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option value="">-- اختر الفصل الدراسي --</option>
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>اسم المادة</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="مثال: الرياضيات 1-1 أو لغتي"
                  value={slotSubject}
                  onChange={e => setSlotSubject(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>رابط الدرس الافتراضي (اختياري - Teams / Zoom / منصة مدرستي)</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://..."
                  value={slotLink}
                  onChange={e => setSlotLink(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {existingCellData ? (
                  <button
                    type="button"
                    onClick={handleDeleteSlot}
                    disabled={isSaving}
                    style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} /> إزالة الحصة
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setIsSlotModalOpen(false)} className="btn btn-secondary">إلغاء</button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">{isSaving ? 'جارٍ الحفظ...' : 'تثبيت في جدولي'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPrintingSchedule && (
        <PrintScheduleModal
          classes={classesList}
          teachers={teachersList.length > 0 ? teachersList : [{ id: teacherDocId || userData?.nationalId || 'teacher', name: userData?.name || 'المعلم', subject: userData?.subject || 'تعليم عام' }]}
          schedules={schedules}
          defaultLevel="teacher"
          initialTeacherId={teacherDocId || userData?.nationalId || teachersList[0]?.id}
          onClose={() => setIsPrintingSchedule(false)}
        />
      )}
    </div>
  );
}
