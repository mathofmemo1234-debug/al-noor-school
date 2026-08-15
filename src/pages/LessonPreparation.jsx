import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MarkdownViewer from '../components/MarkdownViewer';
import { Save, UploadCloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function MarkdownInput({ label, value, onChange, placeholder, height = '200px' }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label>{label} (يدعم LaTeX للرياضيات باستخدام $ و $$)</label>
      <div style={{ display: 'flex', gap: '20px', height }}>
        <textarea 
          className="input-field" 
          style={{ flex: 1, resize: 'none', height: '100%', fontFamily: 'monospace' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
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

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>تحضير الدروس</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
    </div>
  );
}
