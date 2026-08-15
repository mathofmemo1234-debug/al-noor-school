import Settings from './Settings';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

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
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  useEffect(() => {
    if (!studentClass) return;
    const q = query(collection(db, 'weekly_plans'), where('className', '==', studentClass));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPlans(data);
    });
    return () => unsub();
  }, [studentClass]);

  if (!studentClass) {
    return <div className="glass-panel" style={{ padding: '24px' }}>جاري تحميل البيانات...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>الخطة الأسبوعية - فصل {studentClass}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>هنا تجد خطط الأسبوع من جميع المعلمين.</p>
      </div>

      {plans.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          لا توجد خطط أسبوعية مضافة لهذا الفصل بعد.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {plans.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-primary-dark)' }}>المعلم: {p.teacherEmail}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {days.map(day => (
                  <div key={day} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div style={{ width: '100px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{day}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '4px' }}><strong>موضوع الدرس:</strong> {p.plan?.[day]?.topic || 'لا يوجد'}</div>
                      <div><strong>الأهداف:</strong> {p.plan?.[day]?.goals || 'لا يوجد'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

function StudentSchedule() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2>الجدول الدراسي</h2>
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
        سيتم إضافة الجدول الدراسي قريباً.
      </p>
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
