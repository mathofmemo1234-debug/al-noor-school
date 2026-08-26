import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Link as LinkIcon, Edit2, X, Check, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PrintScheduleModal from '../components/PrintScheduleModal';

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

  useEffect(() => {
    // Find the teacher document ID
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

    // Load classes for name mapping
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

    // Load schedules
    const qSchedules = schoolId === 'ALL'
      ? collection(db, 'schedules')
      : query(collection(db, 'schedules'), where('schoolId', '==', schoolId));
    const unsubSchedules = onSnapshot(qSchedules, (snap) => {
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubClasses(); unsubTeachers(); unsubSchedules(); };
  }, [userData?.schoolId]);

  // Filter schedule for this teacher
  const getTeacherCell = (day, period) => {
    const tid = teacherDocId;
    const nid = userData?.nationalId;
    if (!tid && !nid) return null;
    const key = `${day}-${period}`;
    let result = null;
    
    // Loop through all classes schedules to see if the teacher has a class in this period
    for (const schedule of schedules) {
      if (schedule.matrix && schedule.matrix[key]) {
        const cellTeacherId = schedule.matrix[key].teacherId;
        if (cellTeacherId && (cellTeacherId === tid || cellTeacherId === nid)) {
          result = {
            scheduleId: schedule.id, // doc id
            key: key,
            subject: schedule.matrix[key].subject,
            className: classes[schedule.id] || schedule.className || t('teacherSchedule.unknownClass'),
            virtualLink: schedule.matrix[key].virtualLink || ''
          };
          break; // A teacher can only be in one class per period
        }
      }
    }
    return result;
  };

  const handleSaveLink = async () => {
    if (!editingCell) return;
    setIsSaving(true);
    try {
      const scheduleRef = doc(db, 'schedules', editingCell.scheduleId);
      // We only update the specific virtualLink inside the matrix key
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
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--color-primary-dark)' }}>
          <Calendar size={24} /> {t('teacherSchedule.mySchedule')}
        </h2>
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
                  return (
                    <td key={period} style={{ padding: '12px', textAlign: 'center', height: '100px', verticalAlign: 'top' }}>
                      {cell ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(99,178,198,0.1)', padding: '8px', borderRadius: '8px', height: '100%', position: 'relative' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{cell.subject}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{cell.className}</span>
                          
                          {/* Virtual Link Section */}
                          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                            {editingCell && editingCell.scheduleId === cell.scheduleId && editingCell.key === cell.key ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <input 
                                  type="url" 
                                  value={linkInput} 
                                  onChange={e => setLinkInput(e.target.value)} 
                                  placeholder={t('teacherSchedule.platformLink')}
                                  style={{ width: '100%', padding: '4px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                  <button onClick={handleSaveLink} disabled={isSaving} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}><Check size={14}/></button>
                                  <button onClick={() => setEditingCell(null)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}><X size={14}/></button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {cell.virtualLink ? (
                                  <a href={cell.virtualLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                    <LinkIcon size={12} /> {t('teacherSchedule.lessonLink')}
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t('teacherSchedule.noLink')}</span>
                                )}
                                <button 
                                  onClick={() => {
                                    setEditingCell({ scheduleId: cell.scheduleId, key: cell.key });
                                    setLinkInput(cell.virtualLink);
                                  }} 
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                                  title={t('teacherSchedule.addEditLink')}
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#ccc', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
