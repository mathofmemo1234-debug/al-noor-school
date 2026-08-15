import Settings from './Settings';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import StudentSchedule from './StudentSchedule';

function StudentHome() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2>أهلاً بك في بوابة الطالب</h2>
      <p>هنا ستتمكن من عرض جدولك، حل الواجبات، وتحميل الملخصات.</p>
    </div>
  );
}

function useStudentClass() {
  const [studentClass, setStudentClass] = useState(null);
  
  useEffect(() => {
    const fetchClass = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'students'), where('email', '==', auth.currentUser.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setStudentClass(snap.docs[0].data().class);
      }
    };
    fetchClass();
  }, []);

  return studentClass;
}

function StudentWeeklyPlan() {
  const studentClass = useStudentClass();
  const [plans, setPlans] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [teachers, setTeachers] = useState({});
  const [classId, setClassId] = useState(null);
  
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

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
    if (!studentClass) return;
    const q = query(collection(db, 'weekly_plans'), where('className', '==', studentClass));
    const unsubPlans = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPlans(data);
    });
    return () => unsubPlans();
  }, [studentClass]);

  useEffect(() => {
    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      const tMap = {};
      snap.docs.forEach(doc => {
        tMap[doc.id] = doc.data().name;
      });
      setTeachers(tMap);
    });

    if (classId) {
      const unsubSchedule = onSnapshot(doc(db, 'schedules', classId), (docSnap) => {
        if (docSnap.exists()) {
          setScheduleData(docSnap.data().matrix || {});
        } else {
          setScheduleData({});
        }
      });
      return () => { unsubTeachers(); unsubSchedule(); };
    }
    
    return () => unsubTeachers();
  }, [classId]);

  if (!studentClass) {
    return <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}><p style={{color: 'var(--color-text-muted)'}}>لست مسجلاً في أي فصل دراسي بعد.</p></div>;
  }

  // Map plans by teacherId for quick lookup
  const plansByTeacher = {};
  plans.forEach(p => {
    if (p.teacherId) {
      plansByTeacher[p.teacherId] = p.plan;
    }
  });

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>الخطة الأسبوعية - فصل {studentClass}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>تفاصيل الدروس والأهداف مرتبطة بجدولك الدراسي.</p>
      </div>

      {Object.keys(scheduleData).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          لم يتم رفع الجدول الدراسي لفصلك بعد.
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
                      const teacherPlan = plansByTeacher[cell.teacherId] || {};
                      const dayPlan = teacherPlan[day] || {};
                      
                      cellContent = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(99,178,198,0.05)', padding: '12px', borderRadius: '8px', textAlign: 'right', border: '1px solid rgba(99,178,198,0.2)' }}>
                          <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'block' }}>{cell.subject}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>أ. {teachers[cell.teacherId] || 'غير محدد'}</span>
                          </div>
                          
                          <div style={{ fontSize: '13px' }}>
                            <strong style={{ color: '#334155' }}>الدرس:</strong> <span style={{color: '#475569'}}>{dayPlan.topic || 'لم يُحدد'}</span>
                          </div>
                          <div style={{ fontSize: '13px' }}>
                            <strong style={{ color: '#334155' }}>الهدف:</strong> <span style={{color: '#475569'}}>{dayPlan.goals || 'لم يُحدد'}</span>
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

function StudentAssignments() {
  const studentClass = useStudentClass();
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (!studentClass) return;
    const q = query(collection(db, 'assignments'), where('className', '==', studentClass));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setAssignments(data);
    });
    return () => unsub();
  }, [studentClass]);

  if (!studentClass) {
    return <div className="glass-panel" style={{ padding: '24px' }}>جاري تحميل البيانات...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>الواجبات - فصل {studentClass}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>تجد هنا جميع الواجبات المطلوبة من معلمي فصلك.</p>
      </div>

      {assignments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          لا توجد واجبات مضافة لهذا الفصل حالياً.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignments.map(a => (
            <div key={a.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{a.title}</h4>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9em', display: 'flex', gap: '16px' }}>
                <span><strong>المعلم:</strong> {a.teacherEmail}</span>
                <span><strong>آخر موعد:</strong> {a.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentMaterials() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2>الملخصات والمراجعات</h2>
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
        سيتم إضافة قسم الملخصات قريباً.
      </p>
    </div>
  );
}



export default function StudentDashboard() {
  return (
    <Layout role="student" title="لوحة تحكم الطالب">
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/weekly-plan" element={<StudentWeeklyPlan />} />
        <Route path="/assignments" element={<StudentAssignments />} />
        <Route path="/schedule" element={<StudentSchedule />} />
        <Route path="/materials" element={<StudentMaterials />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
