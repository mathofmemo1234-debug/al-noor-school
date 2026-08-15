import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MarkdownViewer from '../components/MarkdownViewer';
import { Save, UploadCloud, Eye, Edit, Trash2, X, Image as ImageIcon, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function MarkdownInput({ label, value, onChange, placeholder, height = '200px' }) {
  const textareaRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + textToInsert);
      return;
    }
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = value.substring(0, startPos);
    const afterText = value.substring(endPos, value.length);
    const newValue = beforeText + textToInsert + afterText;
    onChange(newValue);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = startPos + textToInsert.length;
      textarea.focus();
    }, 0);
  };

  const uploadImage = async (file) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `preparations_inline/${Date.now()}_${file.name || 'image.png'}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      insertTextAtCursor(`\n![صورة](${url})\n`);
    } catch (error) {
      console.error('Error uploading inline image:', error);
      alert('فشل رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        uploadImage(file);
        break;
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    e.target.value = null;
  };

  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ margin: 0 }}>{label} (يدعم LaTeX للرياضيات باستخدام $ و $$)</label>
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            onChange={handleFileSelect}
            title="إدراج صورة"
          />
          <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}>
            {isUploading ? <Loader size={14} className="spin" /> : <ImageIcon size={14} />}
            {isUploading ? 'جاري الرفع...' : 'إدراج صورة'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', height }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea 
            ref={textareaRef}
            className="input-field" 
            style={{ width: '100%', resize: 'none', height: '100%', fontFamily: 'monospace', margin: 0 }}
            value={value}
            onChange={e => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder + "\n(يمكنك لصق الصور مباشرة هنا Ctrl+V)"}
          />
          {isUploading && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-primary)' }}>
                <Loader className="spin" size={24} style={{ marginBottom: '8px' }} />
                <span style={{ fontWeight: 'bold' }}>جاري رفع الصورة...</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: '#fff', overflowY: 'auto' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-text-muted)' }}>معاينة حية:</h4>
          <MarkdownViewer content={value || '*(فارغ)*'} />
        </div>
      </div>
    </div>
  );
}

export default function LessonPreparation() {
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

  // New States
  const [weeks] = useState(Array.from({length: 18}, (_, i) => `الأسبوع ${i + 1}`));
  const [selectedWeek, setSelectedWeek] = useState('الأسبوع 1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  
  // Form fields
  const [goals, setGoals] = useState('');
  const [warmup, setWarmup] = useState('');
  const [portfolio, setPortfolio] = useState('');
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

  // Fetch available classes for this teacher based on their schedule
  useEffect(() => {
    if (!teacherDocId) return;
    const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
      const classNames = {};
      classesSnap.docs.forEach(d => classNames[d.id] = d.data().name);
      
      const unsubSchedules = onSnapshot(collection(db, 'schedules'), (schedulesSnap) => {
        const myClassNames = new Set();
        const mySubjects = new Set();
        
        schedulesSnap.docs.forEach(docSnap => {
          const matrix = docSnap.data().matrix || {};
          let isTeaching = false;
          Object.values(matrix).forEach(cell => {
            if (cell.teacherId === teacherDocId) {
              isTeaching = true;
              if (cell.subject) mySubjects.add(cell.subject);
            }
          });
          if (isTeaching && classNames[docSnap.id]) {
            myClassNames.add(classNames[docSnap.id]);
          }
        });
        setClassesList(Array.from(myClassNames));
        setSubjects(Array.from(mySubjects));
      });
      return () => unsubSchedules();
    });
    return () => unsubClasses();
  }, [teacherDocId]);

  // Fetch available periods based on selected class and subject
  useEffect(() => {
    if (!teacherDocId || !selectedClass || !selectedSubject) {
      setAvailablePeriods([]);
      setSelectedPeriod('');
      return;
    }

    const unsubClasses = onSnapshot(query(collection(db, 'classes'), where('name', '==', selectedClass)), (classSnap) => {
      if (classSnap.empty) return;
      const classId = classSnap.docs[0].id;
      
      const unsubSchedule = onSnapshot(doc(db, 'schedules', classId), (docSnap) => {
        if (docSnap.exists()) {
          const matrix = docSnap.data().matrix || {};
          const periods = [];
          
          Object.entries(matrix).forEach(([key, cell]) => {
            if (cell.teacherId === teacherDocId && cell.subject === selectedSubject) {
              const [day, period] = key.split('-');
              periods.push(`${day} - ${period}`);
            }
          });
          
          setAvailablePeriods(periods);
          if (periods.length > 0) setSelectedPeriod(periods[0]);
          else setSelectedPeriod('');
        }
      });
      return () => unsubSchedule();
    });
    return () => unsubClasses();
  }, [teacherDocId, selectedClass, selectedSubject]);

  // Fetch existing prep for selected class, subject, week, and period
  useEffect(() => {
    if (!teacherDocId || !selectedClass || !selectedSubject || !selectedWeek || !selectedPeriod) {
      setGoals(''); setWarmup(''); setPortfolio(''); setContent(''); setResources(''); setFormativeEval(''); setSummativeEval(''); setHomework(''); setFileUrl(''); setFileName(''); setPrepDocId(null);
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
        setWarmup(data.warmup || '');
        setPortfolio(data.portfolio || '');
        setContent(data.content || '');
        setResources(data.resources || '');
        setFormativeEval(data.formativeEval || '');
        setSummativeEval(data.summativeEval || '');
        setHomework(data.homework || '');
        setFileUrl(data.fileUrl || '');
        setFileName(data.fileName || '');
        setPrepDocId(snapshot.docs[0].id);
      } else {
        setGoals(''); setWarmup(''); setPortfolio(''); setContent(''); setResources(''); setFormativeEval(''); setSummativeEval(''); setHomework(''); setFileUrl(''); setFileName(''); setPrepDocId(null);
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
      alert('تم رفع الملف بنجاح!');
    } catch (error) {
      console.error('Upload Error:', error);
      alert('فشل رفع الملف.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return alert('يجب تسجيل الدخول');
    if (!selectedClass || !selectedSubject) return alert('يرجى اختيار الفصل والمادة');
    if (!selectedPeriod) return alert('يرجى اختيار الحصة');
    
    setIsSaving(true);
    try {
      const payload = {
        teacherId: teacherDocId,
        teacherEmail: auth.currentUser.email,
        className: selectedClass,
        subject: selectedSubject,
        week: selectedWeek,
        date: selectedDate,
        period: selectedPeriod,
        goals,
        warmup,
        portfolio,
        content,
        resources,
        formativeEval,
        summativeEval,
        homework,
        fileUrl,
        fileName,
        updatedAt: new Date().toISOString()
      };

      if (prepDocId) {
        await updateDoc(doc(db, 'preparations', prepDocId), payload);
      } else {
        await addDoc(collection(db, 'preparations'), payload);
      }
      alert('تم حفظ التحضير بنجاح!');
    } catch (error) {
      console.error("Error saving prep:", error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التحضير نهائياً؟')) {
      try {
        await deleteDoc(doc(db, 'preparations', id));
        alert('تم الحذف بنجاح');
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء الحذف');
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
          إضافة / تعديل تحضير
        </button>
        <button 
          className={`btn ${activeTab === 'list' ? 'btn-primary' : ''}`}
          style={{ background: activeTab === 'list' ? '' : 'transparent', color: activeTab === 'list' ? '' : 'var(--color-text)' }}
          onClick={() => setActiveTab('list')}
        >
          سجل التحضيرات ({allPreparations.length})
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
                <option value="">اختر الفصل...</option>
                {classesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="input-field" 
                style={{ width: '150px', marginBottom: 0 }}
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">اختر المادة...</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                className="input-field" 
                style={{ width: '130px', marginBottom: 0 }}
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                {weeks.map(w => <option key={w} value={w}>{w}</option>)}
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
                disabled={!availablePeriods.length}
              >
                <option value="">{availablePeriods.length ? 'اختر الحصة...' : 'لا توجد حصص'}</option>
                {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !selectedClass || !selectedSubject || !selectedPeriod}>
                <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ التحضير'}
              </button>
            </div>
          </div>
          
          {!selectedClass || !selectedSubject ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
              يرجى اختيار الفصل والمادة لبدء التحضير.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>إرفاق ملف التحضير (PDF / JPG)</label>
                  <input type="file" accept=".pdf, .jpg, .jpeg, .png" onChange={handleFileUpload} disabled={isUploading} />
                </div>
                {isUploading && <div style={{ color: 'var(--color-primary)' }}>جاري الرفع...</div>}
                {fileUrl && (
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '8px 16px', borderRadius: '4px' }}>
                    تم إرفاق: <a href={fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', fontWeight: 'bold' }}>{fileName}</a>
                  </div>
                )}
              </div>

              <MarkdownInput 
                label="الأهداف السلوكية" 
                value={goals} 
                onChange={setGoals} 
                placeholder="مثال: أن يتعرف الطالب على..." 
                height="150px" 
              />

              <MarkdownInput 
                label="التهيئة" 
                value={warmup} 
                onChange={setWarmup} 
                placeholder="اكتب التهيئة هنا..." 
                height="150px" 
              />

              <MarkdownInput 
                label="الحقيبة" 
                value={portfolio} 
                onChange={setPortfolio} 
                placeholder="اكتب الحقيبة هنا..." 
                height="150px" 
              />

              <MarkdownInput 
                label="محتوى الدرس" 
                value={content} 
                onChange={setContent} 
                placeholder="اكتب محتوى الدرس هنا... مثال: المعادلة التربيعية هي $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$" 
                height="250px" 
              />

              <MarkdownInput 
                label="الوسائل ومصادر التعلم" 
                value={resources} 
                onChange={setResources} 
                placeholder="اكتب الوسائل ومصادر التعلم..." 
                height="150px" 
              />

              <MarkdownInput 
                label="التقويم البنائي" 
                value={formativeEval} 
                onChange={setFormativeEval} 
                placeholder="اكتب التقويم البنائي..." 
                height="150px" 
              />

              <MarkdownInput 
                label="التقويم النهائي" 
                value={summativeEval} 
                onChange={setSummativeEval} 
                placeholder="اكتب التقويم النهائي..." 
                height="150px" 
              />

              <MarkdownInput 
                label="الواجبات" 
                value={homework} 
                onChange={setHomework} 
                placeholder="اكتب الواجبات..." 
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
              لا توجد تحضيرات محفوظة مسبقاً.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {allPreparations.map(p => (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-primary-dark)' }}>{p.subject} - فصل {p.className}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      <span>{p.week}</span>
                      <span>التاريخ: {p.date}</span>
                      <span>الحصة: {p.period}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ padding: '8px', background: '#e0f2fe', color: '#0284c7' }} onClick={() => setPreviewPrep(p)} title="معاينة">
                      <Eye size={20} />
                    </button>
                    <button className="btn" style={{ padding: '8px', background: '#fef3c7', color: '#d97706' }} onClick={() => handleEdit(p)} title="تعديل">
                      <Edit size={20} />
                    </button>
                    <button className="btn" style={{ padding: '8px', background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDelete(p.id)} title="حذف">
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
                معاينة التحضير: {previewPrep.subject} - {previewPrep.className}
              </h2>
              <button className="btn" style={{ padding: '8px', background: 'transparent' }} onClick={() => setPreviewPrep(null)}>
                <X size={24} color="#64748b" />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                <span>{previewPrep.week}</span>
                <span>الحصة: {previewPrep.period}</span>
                <span>التاريخ: {previewPrep.date}</span>
              </div>

              {previewPrep.fileUrl && (
                <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '8px' }}>
                  <strong>ملف مرفق:</strong> <a href={previewPrep.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>{previewPrep.fileName}</a>
                </div>
              )}

              {['goals', 'warmup', 'portfolio', 'content', 'resources', 'formativeEval', 'summativeEval', 'homework'].map(field => {
                const titles = {
                  goals: 'الأهداف السلوكية',
                  warmup: 'التهيئة',
                  portfolio: 'الحقيبة',
                  content: 'المحتوى',
                  resources: 'الوسائل ومصادر التعلم',
                  formativeEval: 'التقويم البنائي',
                  summativeEval: 'التقويم النهائي',
                  homework: 'الواجبات'
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
    </div>
  );
}
