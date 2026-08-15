import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

export default function WeeklyPlanView({ studentClass = null, schoolId }) {
  const [plans, setPlans] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [teachers, setTeachers] = useState({});
  
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');

  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
  const WEEKS = Array.from({length: 18}, (_, i) => `الأسبوع ${i + 1}`);
  
  const [selectedWeek, setSelectedWeek] = useState(WEEKS[0]);
  const [selectedYear, setSelectedYear] = useState('1447/1448');
  const [selectedSemester, setSelectedSemester] = useState('الفصل الدراسي الأول');

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      const cls = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(cls);
      if (studentClass) {
        const found = cls.find(c => c.name === studentClass);
        if (found) {
          setSelectedClassId(found.id);
          setSelectedClassName(found.name);
        }
      } else if (cls.length > 0 && !selectedClassId) {
        setSelectedClassId(cls[0].id);
        setSelectedClassName(cls[0].name);
      }
    });
    return () => unsub();
  }, [studentClass, schoolId]);

  const handleClassChange = (e) => {
    const cid = e.target.value;
    const cls = classes.find(c => c.id === cid);
    setSelectedClassId(cid);
    if(cls) setSelectedClassName(cls.name);
  };

  useEffect(() => {
    if (!selectedClassName || !schoolId) return;
    const q = query(
      collection(db, 'preparations'), 
      where('schoolId', '==', schoolId),
      where('className', '==', selectedClassName),
      where('week', '==', selectedWeek)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPlans(data);
    });
    return () => unsub();
  }, [selectedClassName, selectedWeek]);

  useEffect(() => {
    if (!schoolId) return;
    const qTeachers = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsubTeachers = onSnapshot(qTeachers, (snap) => {
      const tMap = {};
      snap.docs.forEach(doc => {
        tMap[doc.id] = { name: doc.data().name, whatsapp: doc.data().whatsapp };
      });
      setTeachers(tMap);
    });

    if (selectedClassId) {
      const unsubSchedule = onSnapshot(doc(db, 'schedules', selectedClassId), (docSnap) => {
        if (docSnap.exists()) {
          setScheduleData(docSnap.data().matrix || {});
        } else {
          setScheduleData({});
        }
      });
      return () => { unsubTeachers(); unsubSchedule(); };
    }
    
    return () => unsubTeachers();
  }, [selectedClassId, schoolId]);

  if (studentClass && !selectedClassName) {
    return <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}><p style={{color: 'var(--color-text-muted)'}}>لست مسجلاً في أي فصل دراسي بعد.</p></div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2>الخطة الأسبوعية {studentClass ? `- فصل ${studentClass}` : ''}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>تفاصيل الدروس والأهداف مرتبطة بالجدول الدراسي.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em' }}>العام الدراسي</label>
            <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="1447/1448">1447/1448</option>
              <option value="1448/1449">1448/1449</option>
            </select>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em' }}>الفصل الدراسي</label>
            <select className="input-field" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
              <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
              <option value="الفصل الدراسي الثالث">الفصل الدراسي الثالث</option>
            </select>
          </div>

          {!studentClass && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em' }}>الفصل</label>
              <select className="input-field" value={selectedClassId || ''} onChange={handleClassChange} style={{ marginBottom: 0 }}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em' }}>الأسبوع</label>
            <select className="input-field" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} style={{ marginBottom: 0 }}>
              {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      {Object.keys(scheduleData).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          لم يتم رفع الجدول الدراسي لهذا الفصل بعد.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>اليوم</th>
                {PERIODS.map(p => <th key={p} style={{ textAlign: 'center', minWidth: '150px' }}>الحصة {p}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{day}</td>
                  {PERIODS.map(period => {
                    const key = `${day}-${period}`;
                    const cell = scheduleData[key];
                    let cellContent = <span style={{ color: '#ccc' }}>-</span>;

                    if (cell && cell.subject) {
                      const prepPeriodKey = `${day} - ${period}`;
                      const dayPlan = plans.find(p => p.teacherId === cell.teacherId && p.period === prepPeriodKey) || {};
                      
                      cellContent = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(99,178,198,0.05)', padding: '12px', borderRadius: '8px', textAlign: 'right', border: '1px solid rgba(99,178,198,0.2)' }}>
                          <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'block' }}>{cell.subject}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>أ. {teachers[cell.teacherId]?.name || 'غير محدد'}</span>
                            {teachers[cell.teacherId]?.whatsapp && (
                              <a href={`https://wa.me/${teachers[cell.teacherId].whatsapp}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #25D366' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                                تواصل
                              </a>
                            )}
                          </div>
                          
                          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>
                              <strong style={{ color: '#334155' }}>الأهداف:</strong> 
                              <span style={{color: '#475569'}}> {dayPlan.goals ? dayPlan.goals.substring(0, 50) + (dayPlan.goals.length > 50 ? '...' : '') : 'لم يُحدد'}</span>
                            </div>
                            <div>
                              <strong style={{ color: '#334155' }}>المحتوى:</strong> 
                              <span style={{color: '#475569'}}> {dayPlan.content ? dayPlan.content.substring(0, 50) + (dayPlan.content.length > 50 ? '...' : '') : 'لم يُحدد'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <td key={period} style={{ padding: '8px', verticalAlign: 'top' }}>
                        {cellContent}
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
