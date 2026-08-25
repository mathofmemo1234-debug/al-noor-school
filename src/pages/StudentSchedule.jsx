import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Printer } from 'lucide-react';
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

export default function StudentSchedule() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [scheduleData, setScheduleData] = useState({});
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [teachers, setTeachers] = useState({});
  const [teachersList, setTeachersList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [studentClass, setStudentClass] = useState(null);
  const [classId, setClassId] = useState(null);
  const [isPrintingSchedule, setIsPrintingSchedule] = useState(false);

  useEffect(() => {
    const isParent = userData?.role === 'parent';
    const nid = (isParent ? (userData?.studentNationalId || userData?.nationalId) : (userData?.nationalId || auth.currentUser?.email?.replace('@school.local', '')) || '').trim();

    if (isParent && userData?.studentClass) {
      setStudentClass(userData.studentClass);
    }

    if (!nid && !auth.currentUser?.email) return;

    const q = nid 
      ? query(collection(db, 'students'), where('nationalId', '==', nid))
      : query(collection(db, 'students'), where('email', '==', auth.currentUser.email));

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docs = snap.docs.map(d => d.data());
        const validDoc = docs.find(d => (d.class || d.className)?.trim()) || docs[0];
        const cls = (validDoc?.class || validDoc?.className || '')?.trim();
        if (cls) setStudentClass(cls);
      } else {
        if (!isNaN(nid)) {
          getDocs(query(collection(db, 'students'), where('nationalId', '==', Number(nid)))).then(numSnap => {
            if (!numSnap.empty) {
              const docs = numSnap.docs.map(d => d.data());
              const validDoc = docs.find(d => (d.class || d.className)?.trim()) || docs[0];
              const cls = (validDoc?.class || validDoc?.className || '')?.trim();
              if (cls) setStudentClass(cls);
            }
          });
        }
        if (nid) {
          const uq = query(collection(db, 'users'), where('nationalId', '==', nid));
          const unsubUsers = onSnapshot(uq, (uSnap) => {
            if (!uSnap.empty) {
              const uData = uSnap.docs[0].data();
              setStudentClass((uData.class || uData.className || '')?.trim() || null);
            }
          });
          return () => unsubUsers();
        }
      }
    });

    return () => unsub();
  }, [userData]);

  useEffect(() => {
    const schoolId = userData?.schoolId || 'default_school_1';
    const qClasses = schoolId === 'ALL'
      ? collection(db, 'classes')
      : query(collection(db, 'classes'), where('schoolId', '==', schoolId));

    const unsubClasses = onSnapshot(qClasses, (classesSnap) => {
      const list = [];
      let foundId = null;
      classesSnap.docs.forEach(doc => {
        const d = { id: doc.id, ...doc.data() };
        list.push(d);
        if (studentClass && doc.data().name?.trim() === studentClass.trim()) {
          foundId = doc.id;
        }
      });
      setClassesList(list);
      setClassId(foundId);
    });
    return () => unsubClasses();
  }, [studentClass, userData?.schoolId]);

  useEffect(() => {
    const schoolId = userData?.schoolId || 'default_school_1';

    // Load teachers for name mapping
    const qTeachers = schoolId === 'ALL'
      ? collection(db, 'teachers')
      : query(collection(db, 'teachers'), where('schoolId', '==', schoolId));

    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      const tMap = {};
      const tList = [];
      snap.docs.forEach(doc => {
        const d = { id: doc.id, ...doc.data() };
        tList.push(d);
        tMap[doc.id] = { name: doc.data().name, whatsapp: doc.data().whatsapp };
        if (doc.data().nationalId) {
          tMap[doc.data().nationalId] = { name: doc.data().name, whatsapp: doc.data().whatsapp };
        }
      });
      setTeachers(tMap);
      setTeachersList(tList);
    });

    const qSchedules = schoolId === 'ALL'
      ? collection(db, 'schedules')
      : query(collection(db, 'schedules'), where('schoolId', '==', schoolId));

    const unsubSchedule = onSnapshot(qSchedules, (snap) => {
      const schedList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllSchedules(schedList);

      let foundSchedule = null;
      if (classId) {
        const matchById = schedList.find(d => d.id === classId || d.classId === classId);
        if (matchById) foundSchedule = matchById;
      }
      if (!foundSchedule && studentClass) {
        const matchByName = schedList.find(d => d.className?.trim() === studentClass?.trim());
        if (matchByName) foundSchedule = matchByName;
      }

      if (foundSchedule) {
        setScheduleData(foundSchedule.matrix || {});
        setAcademicYear(foundSchedule.academicYear || '');
        setSemester(foundSchedule.semester || '');
      } else {
        setScheduleData({});
      }
    });

    return () => { unsubTeachers(); unsubSchedule(); };
  }, [classId, studentClass]);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--color-primary-dark)' }}>
          <Calendar size={24} /> {t('studentSchedule.mySchedule')} {studentClass ? `(${studentClass})` : ''}
        </h2>
        {studentClass && (
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
            <Printer size={18} /> طباعة جدول الفصل
          </button>
        )}
      </div>
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

      {isPrintingSchedule && (
        <PrintScheduleModal
          classes={classesList}
          teachers={teachersList}
          schedules={allSchedules}
          defaultLevel="class"
          initialClassId={classId || classesList[0]?.id}
          academicYear={academicYear || '1447-1448'}
          semester={semester || 'الفصل الدراسي الأول'}
          onClose={() => setIsPrintingSchedule(false)}
        />
      )}
    </div>
  );
}
