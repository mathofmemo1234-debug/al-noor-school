import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar } from 'lucide-react';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function StudentSchedule() {
  const { userData } = useAuth();
  const [scheduleData, setScheduleData] = useState({});
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [teachers, setTeachers] = useState({});

  useEffect(() => {
    // Load all teachers for name mapping
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      const tMap = {};
      snap.docs.forEach(doc => {
        tMap[doc.id] = doc.data().name;
      });
      setTeachers(tMap);
    });

    if (userData?.class) {
      // Load class schedule
      const unsubSchedule = onSnapshot(doc(db, 'schedules', userData.class), (docSnap) => {
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
  }, [userData]);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
        <Calendar size={24} /> جدولي الدراسي
      </h2>
      {(academicYear || semester) && (
        <div style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
          {academicYear} | {semester}
        </div>
      )}
      
      {!userData?.class ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          لست مسجلاً في أي فصل دراسي بعد.
        </div>
      ) : Object.keys(scheduleData).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          لم يتم رفع الجدول الدراسي لفصلك بعد.
        </div>
      ) : (
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
                    const cell = scheduleData[key];
                    
                    return (
                      <td key={period} style={{ padding: '12px', textAlign: 'center', height: '60px' }}>
                        {cell && cell.subject ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(99,178,198,0.1)', padding: '8px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{cell.subject}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              أ. {teachers[cell.teacherId] || 'غير محدد'}
                            </span>
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
