import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Link as LinkIcon, Edit2, X, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
  const [teacherDocId, setTeacherDocId] = useState(null);

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
          } else {
            setTeacherDocId(null);
          }
        }
      );
      return () => unsubTeacher();
    }
  }, [userData]);

  useEffect(() => {
    // Load all classes for name mapping
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      const clsMap = {};
      snap.docs.forEach(doc => {
        clsMap[doc.id] = doc.data().name;
      });
      setClasses(clsMap);
    });

    // Load all schedules
    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snap) => {
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubClasses(); unsubSchedules(); };
  }, []);

  // Filter schedule for this teacher
  const getTeacherCell = (day, period) => {
    if (!teacherDocId) return null;
    const key = `${day}-${period}`;
    let result = null;
    
    // Loop through all classes schedules to see if the teacher has a class in this period
    for (const schedule of schedules) {
      if (schedule.matrix && schedule.matrix[key] && schedule.matrix[key].teacherId === teacherDocId) {
        result = {
          scheduleId: schedule.id, // doc id
          key: key,
          subject: schedule.matrix[key].subject,
          className: classes[schedule.id] || t('teacherSchedule.unknownClass'),
          virtualLink: schedule.matrix[key].virtualLink || ''
        };
        break; // A teacher can only be in one class per period
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
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--color-primary-dark)' }}>
        <Calendar size={24} /> {t('teacherSchedule.mySchedule')}
      </h2>
      
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
    </div>
  );
}
