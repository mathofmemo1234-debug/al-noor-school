import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import MarkdownViewer from '../components/MarkdownViewer';

export default function AdminPreparations() {
  const [preparations, setPreparations] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Fetch classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      setClassesList(snap.docs.map(doc => doc.data().name));
    });
    return () => unsub();
  }, []);

  // Fetch teachers for name mapping
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teachers'), (snap) => {
      const map = {};
      snap.docs.forEach(d => map[d.id] = d.data().name);
      setTeachersList(map);
    });
    return () => unsub();
  }, []);

  // Fetch all preparations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'preparations'), (snap) => {
      const data = [];
      snap.docs.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setPreparations(data);
    });
    return () => unsub();
  }, []);

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
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>الفصل: {p.className} - المادة: {p.subject}</h3>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>المعلم: {teachersList[p.teacherId] || p.teacherEmail}</div>
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                  آخر تحديث: {new Date(p.updatedAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>الأهداف:</h4>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>{p.goals || 'لم تُحدد'}</div>
                </div>
                
                <div>
                  <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>المحتوى:</h4>
                  <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <MarkdownViewer content={p.content || '*(فارغ)*'} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>استراتيجيات التدريس:</h4>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>{p.strategy || 'لم تُحدد'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>أساليب التقويم:</h4>
                    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>{p.evaluation || 'لم تُحدد'}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
