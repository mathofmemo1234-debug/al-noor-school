import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MarkdownViewer from '../components/MarkdownViewer';
import { Save, UploadCloud, Eye, Edit, Trash2, X, Image as ImageIcon, Loader, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import MarkdownInput from '../components/MarkdownInput';
import { useLanguage } from '../contexts/LanguageContext';
import PrintLessonPreparationModal from '../components/PrintLessonPreparationModal';

const DEFAULT_PERIODS = [
  'الحصة 1',
  'الحصة 2',
  'الحصة 3',
  'الحصة 4',
  'الحصة 5',
  'الحصة 6',
  'الحصة 7',
  'الحصة 8'
];

export default function LessonPreparation() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [teacherDocId, setTeacherDocId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [prepDocId, setPrepDocId] = useState(null);
  
  // Tabs and History states
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'list'
  const [allPreparations, setAllPreparations] = useState([]);
  const [previewPrep, setPreviewPrep] = useState(null);
  const [printingPrep, setPrintingPrep] = useState(null);

  // New States
  const [weeks] = useState(Array.from({length: 18}, (_, i) => `الأسبوع ${i + 1}`));
  const [selectedWeek, setSelectedWeek] = useState('الأسبوع 1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availablePeriods, setAvailablePeriods] = useState(DEFAULT_PERIODS);
  const [selectedPeriod, setSelectedPeriod] = useState(DEFAULT_PERIODS[0]);
  
  // Form fields
  const [goals, setGoals] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [warmup, setWarmup] = useState('');
  const [strategy, setStrategy] = useState('');
  const [content, setContent] = useState('');
  const [resources, setResources] = useState('');
  const [formativeEval, setFormativeEval] = useState('');
  const [summativeEval, setSummativeEval] = useState('');
  const [homework, setHomework] = useState('');
  
  // File upload state
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch teacher doc ID based on nationalId
  useEffect(() => {
    if (userData?.nationalId) {
      const unsub = onSnapshot(query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId)), (snap) => {
        if (!snap.empty) {
          setTeacherDocId(snap.docs[0].id);
        } else if (!isNaN(userData.nationalId)) {
          const numQ = query(collection(db, 'teachers'), where('nationalId', '==', Number(userData.nationalId)));
          getDocs(numQ).then(numSnap => {
            if (!numSnap.empty) setTeacherDocId(numSnap.docs[0].id);
            else setTeacherDocId(null);
          });
        } else {
          setTeacherDocId(null);
        }
      });
      return () => unsub();
    }
  }, [userData]);

  // Fetch all preps for this teacher
  useEffect(() => {
    if (!teacherDocId) return;
    const q = query(collection(db, 'preparations'), where('teacherId', '==', teacherDocId));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach(d => data.push({ id: d.id, ...d.data() }));
      // Sort by updatedAt descending
      data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setAllPreparations(data);
    });
    return () => unsub();
  }, [teacherDocId]);

  // Fetch available classes for this teacher based on their schedule or classes collection
  useEffect(() => {
    const schoolId = userData?.schoolId || 'default_school_1';
    const qClasses = schoolId === 'ALL'
      ? collection(db, 'classes')
      : query(collection(db, 'classes'), where('schoolId', '==', schoolId));

    const unsubClasses = onSnapshot(qClasses, (classesSnap) => {
      const allClassNames = classesSnap.docs.map(d => d.data().name).filter(Boolean);
      const classNamesMap = {};
      classesSnap.docs.forEach(d => classNamesMap[d.id] = d.data().name);
      
      const qSchedules = schoolId === 'ALL'
        ? collection(db, 'schedules')
        : query(collection(db, 'schedules'), where('schoolId', '==', schoolId));

      const unsubSchedules = onSnapshot(qSchedules, (schedulesSnap) => {
        const myClassNames = new Set();
        const mySubjects = new Set();
        
        schedulesSnap.docs.forEach(docSnap => {
          const matrix = docSnap.data().matrix || {};
          Object.values(matrix).forEach(cell => {
            if (!teacherDocId || cell.teacherId === teacherDocId) {
              if (classNamesMap[docSnap.id]) myClassNames.add(classNamesMap[docSnap.id]);
              if (cell.subject) mySubjects.add(cell.subject);
            }
          });
        });

        // Add teacher's own subjects from profile if available
        if (userData?.subject) {
          userData.subject.split(/[,،]/).map(s => s.trim()).filter(Boolean).forEach(s => mySubjects.add(s));
        }

        const finalClasses = myClassNames.size > 0 ? Array.from(myClassNames) : allClassNames;
        const finalSubjects = mySubjects.size > 0 ? Array.from(mySubjects) : (userData?.subject ? userData.subject.split(/[,،]/).map(s => s.trim()) : []);

        setClassesList(finalClasses);
        setSubjects(finalSubjects);

        if (finalClasses.length > 0) {
          setSelectedClass(prev => finalClasses.includes(prev) ? prev : finalClasses[0]);
        }
        if (finalSubjects.length > 0) {
          setSelectedSubject(prev => finalSubjects.includes(prev) ? prev : finalSubjects[0]);
        }
      });
      return () => unsubSchedules();
    });
    return () => unsubClasses();
  }, [teacherDocId, userData, userData?.schoolId]);

  // Fetch available periods based on selected class and subject
  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setAvailablePeriods(DEFAULT_PERIODS);
      setSelectedPeriod(prev => prev || DEFAULT_PERIODS[0]);
      return;
    }

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('name', '==', selectedClass)), (classSnap) => {
      if (classSnap.empty) {
        setAvailablePeriods(DEFAULT_PERIODS);
        setSelectedPeriod(prev => prev || DEFAULT_PERIODS[0]);
        return;
      }
      const classId = classSnap.docs[0].id;
      
      const unsubSchedule = onSnapshot(doc(db, 'schedules', classId), (docSnap) => {
        if (docSnap.exists()) {
          const matrix = docSnap.data().matrix || {};
          const periods = [];
          
          Object.entries(matrix).forEach(([key, cell]) => {
            if ((!teacherDocId || cell.teacherId === teacherDocId) && cell.subject === selectedSubject) {
              const [day, period] = key.split('-');
              periods.push(`${day} - الحصة ${period}`);
            }
          });
          
          if (periods.length > 0) {
            setAvailablePeriods(periods);
            setSelectedPeriod(prev => periods.includes(prev) ? prev : periods[0]);
          } else {
            setAvailablePeriods(DEFAULT_PERIODS);
            setSelectedPeriod(prev => DEFAULT_PERIODS.includes(prev) ? prev : DEFAULT_PERIODS[0]);
          }
        } else {
          setAvailablePeriods(DEFAULT_PERIODS);
          setSelectedPeriod(prev => DEFAULT_PERIODS.includes(prev) ? prev : DEFAULT_PERIODS[0]);
        }
      });
      return () => unsubSchedule();
    });
    return () => unsubClasses();
  }, [teacherDocId, selectedClass, selectedSubject]);

  // Fetch existing prep for selected class, subject, week, and period
  useEffect(() => {
    if (!teacherDocId || !selectedClass || !selectedSubject || !selectedWeek || !selectedPeriod) {
      setGoals(''); setPortfolio(''); setWarmup(''); setStrategy(''); setContent(''); setResources(''); setFormativeEval(''); setSummativeEval(''); setHomework(''); setFileUrl(''); setFileName(''); setPrepDocId(null);
      return;
    }
    const q = query(
      collection(db, 'preparations'),
      where('teacherId', '==', teacherDocId),
      where('className', '==', selectedClass),
      where('subject', '==', selectedSubject),
      where('week', '==', selectedWeek),
      where('period', '==', selectedPeriod)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setGoals(data.goals || '');
        setPortfolio(data.portfolio || '');
        setWarmup(data.warmup || '');
        setStrategy(data.strategy || '');
        setContent(data.content || '');
        setResources(data.resources || '');
        setFormativeEval(data.formativeEval || '');
        setSummativeEval(data.summativeEval || '');
        setHomework(data.homework || '');
        setFileUrl(data.fileUrl || '');
        setFileName(data.fileName || '');
        setPrepDocId(snapshot.docs[0].id);
      } else {
        setGoals(''); setPortfolio(''); setWarmup(''); setStrategy(''); setContent(''); setResources(''); setFormativeEval(''); setSummativeEval(''); setHomework(''); setFileUrl(''); setFileName(''); setPrepDocId(null);
      }
    });
    return () => unsub();
  }, [selectedClass, selectedSubject, teacherDocId, selectedWeek, selectedPeriod]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `preparations/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFileUrl(url);
      setFileName(file.name);
      alert(t('lessonPreparation.uploadSuccess'));
    } catch (error) {
      console.error('Upload Error:', error);
      alert(t('lessonPreparation.uploadFail'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return alert(t('lessonPreparation.mustLogin'));
    if (!selectedClass || !selectedSubject) return alert(t('lessonPreparation.mustSelectClassSubj'));
    if (!selectedPeriod) return alert(t('lessonPreparation.mustSelectPeriod'));
    
    setIsSaving(true);
    try {
      const payload = {
        teacherId: teacherDocId || userData?.nationalId || auth.currentUser.uid,
        teacherName: userData?.name || 'معلم',
        teacherNationalId: userData?.nationalId || '',
        teacherEmail: auth.currentUser.email,
        schoolId: userData?.schoolId || 'default_school_1',
        className: selectedClass,
        subject: selectedSubject,
        week: selectedWeek,
        date: selectedDate,
        period: selectedPeriod,
        goals,
        portfolio,
        warmup,
        strategy,
        content,
        resources,
        formativeEval,
        summativeEval,
        homework,
        fileUrl,
        fileName,
        schoolId: userData?.schoolId || 'default_school_1',
        updatedAt: new Date().toISOString()
      };

      if (prepDocId) {
        await updateDoc(doc(db, 'preparations', prepDocId), payload);
      } else {
        await addDoc(collection(db, 'preparations'), payload);
      }
      alert(t('lessonPreparation.saveSuccess'));
    } catch (error) {
      console.error("Error saving prep:", error);
      alert(t('lessonPreparation.saveFail'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('lessonPreparation.confirmDelete'))) {
      try {
        await deleteDoc(doc(db, 'preparations', id));
        alert(t('lessonPreparation.deleteSuccess'));
      } catch (err) {
        console.error(err);
        alert(t('lessonPreparation.deleteFail'));
      }
    }
  };

  const handleEdit = (prep) => {
    setSelectedClass(prep.className);
    setSelectedSubject(prep.subject);
    setSelectedWeek(prep.week);
    setSelectedDate(prep.date);
    // Timeout needed slightly for available periods to fetch based on subject/class, 
    // although period might not be in the initial list if not loaded yet.
    setTimeout(() => {
      setSelectedPeriod(prep.period);
    }, 500);
    setActiveTab('form');
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
        <button 
          className={`btn ${activeTab === 'form' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'form' ? '' : 'transparent', color: activeTab === 'form' ? '' : 'var(--color-text)' }}
          onClick={() => setActiveTab('form')}
        >
          {t('lessonPreparation.addEditPrep')}
        </button>
        <button 
          className={`btn ${activeTab === 'list' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'list' ? '' : 'transparent', color: activeTab === 'list' ? '' : 'var(--color-text)' }}
          onClick={() => setActiveTab('list')}
        >
          {t('lessonPreparation.prepRecord')} ({allPreparations.length})
        </button>
      </div>

      {activeTab === 'form' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                className="input-field" 
                style={{ width: '150px', marginBottom: 0 }}
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">{t('lessonPreparation.selectClass')}</option>
                {classesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="input-field" 
                style={{ width: '150px', marginBottom: 0 }}
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">{t('lessonPreparation.selectSubject')}</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                className="input-field" 
                style={{ width: '130px', marginBottom: 0 }}
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                {weeks.map(w => <option key={w} value={w}>{w.replace('الأسبوع', t('lessonPreparation.weekPrefix'))}</option>)}
              </select>

              <input 
                type="date"
                className="input-field"
                style={{ width: '150px', marginBottom: 0 }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <select 
                className="input-field" 
                style={{ width: '150px', marginBottom: 0 }}
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="">{t('lessonPreparation.selectPeriod')}</option>
                {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !selectedClass || !selectedSubject || !selectedPeriod}>
                <Save size={18} /> {isSaving ? t('lessonPreparation.saving') : t('lessonPreparation.savePrep')}
              </button>
            </div>
          </div>
          
          {!selectedClass || !selectedSubject ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
              {t('lessonPreparation.pleaseSelectClassSubj')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{t('lessonPreparation.attachPrepFile')}</label>
                  <input type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={handleFileUpload} disabled={isUploading} />
                </div>
                {isUploading && <div style={{ color: 'var(--color-primary)' }}>{t('lessonPreparation.uploading')}</div>}
                {fileUrl && (
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '8px 16px', borderRadius: '4px' }}>
                    {t('lessonPreparation.attached')} <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', fontWeight: 'bold' }}>{fileName}</a>
                  </div>
                )}
              </div>

              <MarkdownInput 
                label={t('lessonPreparation.behavioralGoals')} 
                value={goals} 
                onChange={setGoals} 
                placeholder={t('lessonPreparation.behavioralGoalsPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.portfolio')} 
                value={portfolio} 
                onChange={setPortfolio} 
                placeholder={t('lessonPreparation.portfolioPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.warmup')} 
                value={warmup} 
                onChange={setWarmup} 
                placeholder={t('lessonPreparation.warmupPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.teachingStrategies')} 
                value={strategy} 
                onChange={setStrategy} 
                placeholder={t('lessonPreparation.teachingStrategiesPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.lessonContent')} 
                value={content} 
                onChange={setContent} 
                placeholder={t('lessonPreparation.lessonContentPlaceholder')} 
                height="250px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.resources')} 
                value={resources} 
                onChange={setResources} 
                placeholder={t('lessonPreparation.resourcesPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.formativeEval')} 
                value={formativeEval} 
                onChange={setFormativeEval} 
                placeholder={t('lessonPreparation.formativeEvalPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.summativeEval')} 
                value={summativeEval} 
                onChange={setSummativeEval} 
                placeholder={t('lessonPreparation.summativeEvalPlaceholder')} 
                height="150px" 
              />

              <MarkdownInput 
                label={t('lessonPreparation.homework')} 
                value={homework} 
                onChange={setHomework} 
                placeholder={t('lessonPreparation.homeworkPlaceholder')} 
                height="150px" 
              />

            </div>
          )}
        </>
      )}

      {activeTab === 'list' && (
        <div>
          {allPreparations.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
              {t('lessonPreparation.noSavedPreps')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {allPreparations.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{p.subject} - {t('lessonPreparation.classWord')} {p.className}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      <span>{p.week.replace('الأسبوع', t('lessonPreparation.weekPrefix'))}</span>
                      <span>{t('lessonPreparation.date')} {p.date}</span>
                      <span>{t('lessonPreparation.periodLabel')} {p.period}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ padding: '8px', background: '#0e7490', color: 'white' }} onClick={() => setPrintingPrep(p)} title="طباعة التحضير (PDF)">
                      <Printer size={20} />
                    </button>
                    <button className="btn" style={{ padding: '8px', background: '#e0f2fe', color: '#0284c7' }} onClick={() => setPreviewPrep(p)} title={t('lessonPreparation.preview')}>
                      <Eye size={20} />
                    </button>
                    <button className="btn" style={{ padding: '8px', background: '#fef3c7', color: '#d97706' }} onClick={() => handleEdit(p)} title={t('lessonPreparation.edit')}>
                      <Edit size={20} />
                    </button>
                    <button className="btn" style={{ padding: '8px', background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDelete(p.id)} title={t('lessonPreparation.delete')}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewPrep && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', width: '90%', maxWidth: '900px', maxHeight: '90vh',
            borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>
                {t('lessonPreparation.previewPrep')} {previewPrep.subject} - {previewPrep.className}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px', background: 'linear-gradient(135deg, #0e7490, #63B2C6)' }}
                  onClick={() => setPrintingPrep(previewPrep)}
                >
                  <Printer size={16} /> طباعة التحضير (PDF)
                </button>
                <button className="btn" style={{ padding: '8px', background: 'transparent' }} onClick={() => setPreviewPrep(null)}>
                  <X size={24} color="#64748b" />
                </button>
              </div>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                <span>{previewPrep.week.replace('الأسبوع', t('lessonPreparation.weekPrefix'))}</span>
                <span>{t('lessonPreparation.periodLabel')} {previewPrep.period}</span>
                <span>{t('lessonPreparation.date')} {previewPrep.date}</span>
              </div>

              {previewPrep.fileUrl && (
                <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '8px' }}>
                  <strong>{t('lessonPreparation.attachedFile')}</strong> <a href={previewPrep.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>{previewPrep.fileName}</a>
                </div>
              )}

              {['goals', 'portfolio', 'warmup', 'strategy', 'content', 'resources', 'formativeEval', 'summativeEval', 'homework'].map(field => {
                const titles = {
                  goals: t('lessonPreparation.behavioralGoals'),
                  portfolio: t('lessonPreparation.portfolio'),
                  warmup: t('lessonPreparation.warmup'),
                  strategy: t('lessonPreparation.teachingStrategies'),
                  content: t('lessonPreparation.lessonContent'),
                  resources: t('lessonPreparation.resources'),
                  formativeEval: t('lessonPreparation.formativeEval'),
                  summativeEval: t('lessonPreparation.summativeEval'),
                  homework: t('lessonPreparation.homework')
                };
                if (!previewPrep[field]) return null;
                return (
                  <div key={field}>
                    <h4 style={{ color: 'var(--color-secondary-dark)', margin: '0 0 8px 0' }}>{titles[field]}:</h4>
                    <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <MarkdownViewer content={previewPrep[field]} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {printingPrep && (
        <PrintLessonPreparationModal prep={printingPrep} onClose={() => setPrintingPrep(null)} />
      )}
    </div>
  );
}
