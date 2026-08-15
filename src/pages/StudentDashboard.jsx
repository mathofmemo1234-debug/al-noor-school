import Settings from './Settings';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import StudentSchedule from './StudentSchedule';
import StudentExams from './StudentExams';

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

import WeeklyPlanView from '../components/WeeklyPlanView';

function StudentWeeklyPlan() {
  const studentClass = useStudentClass();
  return <WeeklyPlanView studentClass={studentClass} />;
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

import MarkdownViewer from '../components/MarkdownViewer';
import { Download, Link as LinkIcon } from 'lucide-react';

function StudentMaterials() {
  const studentClass = useStudentClass();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    if (!studentClass) return;
    const q = query(collection(db, 'materials'), where('className', '==', studentClass));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setMaterials(data);
    });
    return () => unsub();
  }, [studentClass]);

  if (!studentClass) {
    return <div className="glass-panel" style={{ padding: '24px' }}>جاري تحميل البيانات...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>الملخصات والمصادر الإضافية - فصل {studentClass}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>جميع المرفقات والروابط التي شاركها معلموك.</p>
      </div>

      {materials.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          لا توجد ملخصات مضافة لهذا الفصل حالياً.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {materials.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(99,178,198,0.1)', borderRadius: '12px', color: 'var(--color-primary)' }}>
                  {m.type === 'file' ? <Download size={24} /> : <LinkIcon size={24} />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-primary-dark)' }}>{m.title}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>المادة: {m.subject} | المعلم: {m.teacherEmail}</div>
                </div>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <a 
                  href={m.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary" 
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  {m.type === 'file' ? 'تحميل / فتح الملف' : 'فتح الرابط'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentPreparations() {
  const studentClass = useStudentClass();
  const [preparations, setPreparations] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    if (!studentClass) return;
    const q = query(collection(db, 'preparations'), where('className', '==', studentClass));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setPreparations(data);
    });
    return () => unsub();
  }, [studentClass]);

  if (!studentClass) {
    return <div className="glass-panel" style={{ padding: '24px' }}>جاري تحميل البيانات...</div>;
  }

  // Get unique subjects
  const subjects = [...new Set(preparations.map(p => p.subject))];
  
  // Filter by selected subject
  const filtered = selectedSubject ? preparations.filter(p => p.subject === selectedSubject) : preparations;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>تحضير الدروس - فصل {studentClass}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>اطلع على المحتوى والأهداف لكل مادة.</p>
        </div>
        
        {subjects.length > 0 && (
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">جميع المواد</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {preparations.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          لا توجد تحضيرات مضافة لهذا الفصل حالياً.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>المادة: {p.subject}</h3>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>المعلم: {p.teacherEmail}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{p.week || 'الأسبوع 1'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>التاريخ: {p.date || '-'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>الحصة: {p.period || '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {p.fileUrl && (
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '8px' }}>
                    <strong>ملف مرفق:</strong> <a href={p.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>{p.fileName}</a>
                  </div>
                )}

                {['goals', 'portfolio', 'warmup', 'strategy', 'content', 'resources', 'formativeEval', 'summativeEval', 'homework'].map(field => {
                  const titles = {
                    goals: 'الأهداف السلوكية',
                    portfolio: 'الحقبنة',
                    warmup: 'التهيئة',
                    strategy: 'استراتيجيات التدريس',
                    content: 'محتوى الدرس',
                    resources: 'الوسائل ومصادر التعلم',
                    formativeEval: 'التقويم البنائي',
                    summativeEval: 'التقويم النهائي',
                    homework: 'الواجبات'
                  };
                  if (!p[field]) return null;
                  return (
                    <div key={field}>
                      <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>{titles[field]}:</h4>
                      <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <MarkdownViewer content={p[field]} />
                      </div>
                    </div>
                  );
                })}
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
        <Route path="/assignments" element={<StudentAssignments />} />
        <Route path="/schedule" element={<StudentSchedule />} />
        <Route path="/materials" element={<StudentMaterials />} />
        <Route path="/preparations" element={<StudentPreparations />} />
        <Route path="/exams" element={<StudentExams />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
