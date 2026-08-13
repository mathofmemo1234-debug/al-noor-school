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

function StudentWeeklyPlan() {
  const [studentClass, setStudentClass] = useState(null);
  const [plans, setPlans] = useState([]);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  // Fetch student's class
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

  // Fetch plans for that class
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

export default function StudentDashboard() {
  return (
    <Layout role="student" title="لوحة تحكم الطالب">
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/weekly-plan" element={<StudentWeeklyPlan />} />
      </Routes>
    </Layout>
  );
}
