import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import MarkdownViewer from '../components/MarkdownViewer';
import { useLanguage } from '../contexts/LanguageContext';
import { Printer } from 'lucide-react';
import PrintLessonPreparationModal from '../components/PrintLessonPreparationModal';

export default function AdminPreparations({ schoolId }) {
  const { t } = useLanguage();
  const [preparations, setPreparations] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [printingPrep, setPrintingPrep] = useState(null);

  const targetSchoolId = schoolId || 'default_school_1';

  // Fetch classes
  useEffect(() => {
    const qClasses = schoolId === 'ALL'
      ? collection(db, 'classes')
      : query(collection(db, 'classes'), where('schoolId', '==', targetSchoolId));

    const unsub = onSnapshot(qClasses, (snap) => {
      const docs = snap.docs.map(doc => doc.data());
      setClassesList(Array.from(new Set(docs.map(d => d.name).filter(Boolean))));
    });
    return () => unsub();
  }, [schoolId, targetSchoolId]);

  // Fetch teachers for name mapping
  useEffect(() => {
    const qTeachers = schoolId === 'ALL'
      ? collection(db, 'teachers')
      : query(collection(db, 'teachers'), where('schoolId', '==', targetSchoolId));

    const unsub = onSnapshot(qTeachers, (snap) => {
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = data.name;
        if (data.nationalId) map[data.nationalId] = data.name;
      });
      setTeachersList(map);
    });
    return () => unsub();
  }, [schoolId, targetSchoolId]);

  // Fetch preparations
  useEffect(() => {
    const qPreps = schoolId === 'ALL'
      ? collection(db, 'preparations')
      : query(collection(db, 'preparations'), where('schoolId', '==', targetSchoolId));

    const unsub = onSnapshot(qPreps, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setPreparations(data);
    });
    return () => unsub();
  }, [schoolId, targetSchoolId]);

  let filtered = preparations;
  if (selectedClass) filtered = filtered.filter(p => p.className === selectedClass);
  if (selectedTeacher) {
    filtered = filtered.filter(p => 
      p.teacherId === selectedTeacher || 
      p.teacherNationalId === selectedTeacher ||
      p.teacherName === teachersList[selectedTeacher]
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>{t('adminPreparations.title')} ({filtered.length})</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select 
          className="input-field" 
          style={{ width: '250px', marginBottom: 0 }}
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">{t('adminPreparations.allClasses')}</option>
          {classesList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        
        <select 
          className="input-field" 
          style={{ width: '250px', marginBottom: 0 }}
          value={selectedTeacher} 
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">{t('adminPreparations.allTeachers')}</option>
          {Object.entries(teachersList).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
          {t('adminPreparations.noPreparations')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>
                    {p.lessonTitle ? `${p.lessonTitle} - ` : ''}{t('adminPreparations.classPrefix')} {p.className} - {t('adminPreparations.subjectPrefix')} {p.subject}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                    {p.semester && (
                      <span style={{ background: '#f1f5f9', color: '#0e7490', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {p.semester}
                      </span>
                    )}
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      {t('adminPreparations.teacherPrefix')} {p.teacherName || teachersList[p.teacherId] || teachersList[p.teacherNationalId] || p.teacherEmail}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => setPrintingPrep(p)}
                    className="btn btn-primary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(135deg, #0e7490, #63B2C6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Printer size={15} /> طباعة التحضير (PDF)
                  </button>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{p.week || t('adminPreparations.week1')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{t('adminPreparations.datePrefix')} {p.date || '-'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{t('adminPreparations.periodPrefix')} {p.period || '-'}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {t('adminPreparations.updatedPrefix')} {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('ar-EG') : '-'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {p.fileUrl && (
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '8px' }}>
                    <strong>{t('adminPreparations.attachedFile')}</strong> <a href={p.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>{p.fileName}</a>
                  </div>
                )}
                
                {['goals', 'portfolio', 'warmup', 'strategy', 'content', 'resources', 'formativeEval', 'summativeEval', 'homework'].map(field => {
                  const titles = {
                    goals: t('adminPreparations.goals'),
                    portfolio: t('adminPreparations.portfolio'),
                    warmup: t('adminPreparations.warmup'),
                    strategy: t('adminPreparations.strategy'),
                    content: t('adminPreparations.content'),
                    resources: t('adminPreparations.resources'),
                    formativeEval: t('adminPreparations.formativeEval'),
                    summativeEval: t('adminPreparations.summativeEval'),
                    homework: t('adminPreparations.homework')
                  };
                  if (!p[field]) return null;
                  return (
                    <div key={field}>
                      <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>{titles[field]}</h4>
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

      {printingPrep && (
        <PrintLessonPreparationModal prep={printingPrep} onClose={() => setPrintingPrep(null)} />
      )}
    </div>
  );
}
