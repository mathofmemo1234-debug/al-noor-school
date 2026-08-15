import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import MarkdownViewer from '../components/MarkdownViewer';

export default function AdminPreparations({ schoolId }) {
  const [preparations, setPreparations] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Fetch classes
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      setClassesList(snap.docs.map(doc => doc.data().name));
    });
    return () => unsub();
  }, [schoolId]);

  // Fetch teachers for name mapping
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach(d => map[d.id] = d.data().name);
      setTeachersList(map);
    });
    return () => unsub();
  }, [schoolId]);

  // Fetch all preparations
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'preparations'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      const data = [];
      snap.docs.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPreparations(data);
    });
    return () => unsub();
  }, [schoolId]);

  let filtered = preparations;
  if (selectedClass) filtered = filtered.filter(p => p.className === selectedClass);
  if (selectedTeacher) filtered = filtered.filter(p => p.teacherId === selectedTeacher);

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>متابعة تحضيرات المعلمين</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select 
          className="input-field" 
          style={{ width: '250px', marginBottom: 0 }}
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">جميع الفصول</option>
          {classesList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select 
          className="input-field" 
          style={{ width: '250px', marginBottom: 0 }}
          value={selectedTeacher} 
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">جميع المعلمين</option>
          {Object.entries(teachersList).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          لا توجد تحضيرات تطابق البحث.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>الفصل: {p.className} - المادة: {p.subject}</h3>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>المعلم: {teachersList[p.teacherId] || p.teacherEmail}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{p.week || 'الأسبوع 1'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>التاريخ: {p.date || '-'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>الحصة: {p.period || '-'}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '8px' }}>
                    تحديث: {new Date(p.updatedAt).toLocaleDateString('ar-EG')}
                  </div>
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
