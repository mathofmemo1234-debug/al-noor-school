import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar } from 'lucide-react';
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

export default function StudentSchedule() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [scheduleData, setScheduleData] = useState({});
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [teachers, setTeachers] = useState({});
  const [studentClass, setStudentClass] = useState(null);

  const [classId, setClassId] = useState(null);

  useEffect(() => {
    if (userData?.nationalId) {
      const unsub = onSnapshot(
        query(collection(db, 'students'), where('nationalId', '==', userData.nationalId)),
        (snap) => {
          if (!snap.empty) {
            setStudentClass(snap.docs[0].data().class);
          } else {
            setStudentClass(null);
          }
        }
      );
      return () => unsub();
    }
  }, [userData]);

  useEffect(() => {
    if (studentClass) {
      const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
        let foundId = null;
        classesSnap.docs.forEach(doc => {
          if (doc.data().name === studentClass) {
            foundId = doc.id;
          }
        });
        setClassId(foundId);
      });
      return () => unsubClasses();
    } else {
      setClassId(null);
    }
  }, [studentClass]);

  useEffect(() => {
    // Load all teachers for name mapping
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      const tMap = {};
      snap.docs.forEach(doc => {
        tMap[doc.id] = { name: doc.data().name, whatsapp: doc.data().whatsapp };
      });
      setTeachers(tMap);
    });

    if (classId) {
      // Load class schedule using the actual classId
      const unsubSchedule = onSnapshot(doc(db, 'schedules', classId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setScheduleData(data.matrix || {});
          setAcademicYear(data.academicYear || '');
          setSemester(data.semester || '');
        } else {
          setScheduleData({});
        }
      });
      return () => { unsubTeachers(); unsubSchedule(); };
    }
    
    return () => unsubTeachers();
  }, [classId]);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
        <Calendar size={24} /> {t('studentSchedule.mySchedule')}
      </h2>
      {(academicYear || semester) && (
        <div style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
          {academicYear} | {semester}
        </div>
      )}
      
      {!studentClass ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          {t('studentSchedule.notEnrolled')}
        </div>
      ) : Object.keys(scheduleData).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          {t('studentSchedule.scheduleNotUploaded')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>{t('studentSchedule.day')}</th>
                {PERIODS.map(p => <th key={p} style={{ textAlign: 'center' }}>{t('studentSchedule.period')} {p}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{t(`days.${dayMap[day]}`)}</td>
                  {PERIODS.map(period => {
                    const key = `${day}-${period}`;
                    const cell = scheduleData[key];
                    
                    return (
                      <td key={period} style={{ padding: '12px', textAlign: 'center', height: '60px' }}>
                        {cell && cell.subject ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(99,178,198,0.1)', padding: '8px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{cell.subject}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {t('studentSchedule.mr')} {teachers[cell.teacherId]?.name || t('studentSchedule.unspecified')}
                            </span>
                            {teachers[cell.teacherId]?.whatsapp && (
                              <a href={`https://wa.me/${teachers[cell.teacherId].whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#25D366', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #25D366' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                                {t('studentSchedule.contact')}
                              </a>
                            )}
                            {cell.virtualLink && (
                              <a href={cell.virtualLink} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #3b82f6' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                {t('studentSchedule.lessonLink')}
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#ccc' }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
