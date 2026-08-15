import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Calendar } from 'lucide-react';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherSchedule() {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState({});

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
  // Find which class and subject the teacher is assigned to for each period
  const getTeacherCell = (day, period) => {
    const key = `${day}-${period}`;
    let result = null;
    
    // Loop through all classes schedules to see if the teacher has a class in this period
    for (const schedule of schedules) {
      if (schedule.matrix && schedule.matrix[key] && schedule.matrix[key].teacherId === currentUser?.uid) {
        result = {
          subject: schedule.matrix[key].subject,
          className: classes[schedule.classId] || 'فصل غير معروف',
          academicYear: schedule.academicYear,
          semester: schedule.semester
        };
        break; // A teacher can only be in one class per period
      }
    }
    return result;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--color-primary-dark)' }}>
        <Calendar size={24} /> جدولي الدراسي
      </h2>
      
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
                  const cell = getTeacherCell(day, period);
                  return (
                    <td key={period} style={{ padding: '12px', textAlign: 'center', height: '60px' }}>
                      {cell ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(99,178,198,0.1)', padding: '8px', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{cell.subject}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{cell.className}</span>
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
    </div>
  );
}
