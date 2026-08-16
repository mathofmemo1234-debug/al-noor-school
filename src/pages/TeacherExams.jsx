import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, Plus, Save, Clock, BookOpen, Users, FileText, CheckCircle, BarChart2 } from 'lucide-react';
import MarkdownInput from '../components/MarkdownInput';
import { useLanguage } from '../contexts/LanguageContext';

export default function TeacherExams() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [exams, setExams] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teacherDocId, setTeacherDocId] = useState(null);
  
  // Modes
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create' | 'edit' | 'results'
  
  // Form State
  const [currentExam, setCurrentExam] = useState(null);
  const [title, setTitle] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([]);
  
  // Results state
  const [examResults, setExamResults] = useState([]);
  const [studentsCache, setStudentsCache] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Get teacher ID
  useEffect(() => {
    if (userData?.nationalId) {
      const q = query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId));
      const unsub = onSnapshot(q, snap => {
        if (!snap.empty) {
          setTeacherDocId(snap.docs[0].id);
          const subjStr = snap.docs[0].data().subject || '';
          setSubjectsList(subjStr.split('،').map(s => s.trim()).filter(Boolean));
        }
      });
      return () => unsub();
    }
  }, [userData]);

  // Fetch classes from schedule
  useEffect(() => {
    if (!teacherDocId) return;
    const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
      const classNames = {};
      classesSnap.docs.forEach(d => classNames[d.id] = d.data().name);
      
      const unsubSchedules = onSnapshot(collection(db, 'schedules'), (schedulesSnap) => {
        const myClassNames = new Set();
        schedulesSnap.docs.forEach(docSnap => {
          const matrix = docSnap.data().matrix || {};
          let isTeaching = false;
          Object.values(matrix).forEach(cell => {
            if (cell.teacherId === teacherDocId) isTeaching = true;
          });
          if (isTeaching && classNames[docSnap.id]) {
            myClassNames.add(classNames[docSnap.id]);
          }
        });
        setClassesList(Array.from(myClassNames));
      });
      return () => unsubSchedules();
    });
    return () => unsubClasses();
  }, [teacherDocId]);

  // Fetch exams
  useEffect(() => {
    if (!teacherDocId) return;
    const q = query(collection(db, 'exams'), where('teacherId', '==', teacherDocId));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      // Sort by creation date descending
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setExams(data);
    });
    return () => unsub();
  }, [teacherDocId]);

  // Fetch students name cache for results
  useEffect(() => {
    if (activeView === 'results') {
      getDocs(collection(db, 'students')).then(snap => {
        const cache = {};
        snap.forEach(d => {
          cache[d.id] = d.data().name;
        });
        setStudentsCache(cache);
      });
    }
  }, [activeView]);

  // Initialize questions array when numQuestions changes
  useEffect(() => {
    if (activeView === 'list' || activeView === 'results') return;
    const count = parseInt(numQuestions) || 1;
    setQuestions(prev => {
      const newQs = [...prev];
      if (newQs.length < count) {
        for (let i = newQs.length; i < count; i++) {
          newQs.push({
            id: `q_${Date.now()}_${i}`,
            text: '',
            options: ['', '', '', ''],
            correctOption: 0
          });
        }
      } else if (newQs.length > count) {
        newQs.splice(count);
      }
      return newQs;
    });
  }, [numQuestions, activeView]);

  const resetForm = () => {
    setCurrentExam(null);
    setTitle('');
    setTargetClass(classesList[0] || '');
    setSubject(subjectsList[0] || '');
    setExamDate('');
    setStartTime('');
    setDuration('45');
    setNumQuestions(1);
    setQuestions([]);
    setActiveView('list');
    setExamResults([]);
  };

  const handleEdit = (exam) => {
    setCurrentExam(exam);
    setTitle(exam.title);
    setTargetClass(exam.targetClass);
    setSubject(exam.subject);
    setExamDate(exam.examDate);
    setStartTime(exam.startTime);
    setDuration(exam.duration);
    setNumQuestions(exam.questions.length);
    setQuestions(exam.questions);
    setActiveView('edit');
  };

  const handleViewResults = async (exam) => {
    setCurrentExam(exam);
    setActiveView('results');
    // Fetch results
    const q = query(collection(db, 'exam_results'), where('examId', '==', exam.id));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    setExamResults(results);
  };

  const handleDelete = async (examId) => {
    if (window.confirm(t('teacherExams.confirmDelete'))) {
      await deleteDoc(doc(db, 'exams', examId));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!teacherDocId) return;
    
    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text) {
        alert(t('teacherExams.questionEmpty').replace('{num}', i+1));
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j]) {
          alert(t('teacherExams.optionEmpty').replace('{opt}', j+1).replace('{num}', i+1));
          return;
        }
      }
    }

    setIsSaving(true);
    const examData = {
      teacherId: teacherDocId,
      title,
      targetClass,
      subject,
      examDate,
      startTime,
      duration: parseInt(duration),
      questions,
      updatedAt: serverTimestamp()
    };

    try {
      if (activeView === 'edit' && currentExam) {
        await updateDoc(doc(db, 'exams', currentExam.id), examData);
      } else {
        examData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'exams'), examData);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert(t('teacherExams.saveFail'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestion = (index, field, value) => {
    const newQs = [...questions];
    newQs[index][field] = value;
    setQuestions(newQs);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const newQs = [...questions];
    newQs[qIndex].options[optIndex] = value;
    setQuestions(newQs);
  };

  if (activeView === 'list') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2><FileText style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> {t('teacherExams.electronicExams')}</h2>
          <button className="btn btn-primary" onClick={() => {
            setTargetClass(classesList[0] || '');
            setSubject(subjectsList[0] || '');
            setActiveView('create');
          }}>
            <Plus size={18} /> {t('teacherExams.createNewExam')}
          </button>
        </div>

        {exams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            {t('teacherExams.noExamsRecorded')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {exams.map(exam => (
              <div key={exam.id} style={{ background: 'rgba(255,255,255,0.7)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)' }}>{exam.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16}/> {t('teacherExams.classLabel')} {exam.targetClass}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={16}/> {t('teacherExams.subjectLabel')} {exam.subject}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> {t('teacherExams.timeLabel')} {exam.examDate} | {exam.startTime} ({exam.duration} {t('teacherExams.minutes')})</div>
                  <div>{t('teacherExams.questionsCount')} {exam.questions.length} {t('teacherExams.questions')}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '4px' }} onClick={() => handleViewResults(exam)}>
                    <BarChart2 size={16} /> {t('teacherExams.viewGradesResults')}
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => handleEdit(exam)}>
                    <Edit size={16} /> {t('teacherExams.edit')}
                  </button>
                  <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDelete(exam.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'results') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '16px' }}>
          <h2><BarChart2 style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> {t('teacherExams.studentGrades')} {currentExam?.title}</h2>
          <button className="btn btn-outline" onClick={resetForm}>{t('teacherExams.backToList')}</button>
        </div>

        {examResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
            {t('teacherExams.noStudentsSubmitted')}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('teacherExams.studentName')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>{t('teacherExams.grade')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>{t('teacherExams.percentage')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>{t('teacherExams.submitTime')}</th>
                </tr>
              </thead>
              <tbody>
                {examResults.map(res => {
                  const percentage = Math.round((res.score / res.totalQuestions) * 100);
                  const isPass = percentage >= 50;
                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>{studentsCache[res.studentId] || t('teacherExams.unknownStudent')}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold' }}>
                        {res.score} / {res.totalQuestions}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: isPass ? '#166534' : '#991b1b' }}>
                        {percentage}%
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontSize: '14px' }}>
                        {res.timestamp?.toDate().toLocaleString('ar-SA')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '16px' }}>
        <h2>{activeView === 'create' ? t('teacherExams.createExam') : t('teacherExams.editExam')}</h2>
        <button className="btn btn-outline" onClick={resetForm}>{t('teacherExams.backToList')}</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group">
            <label>{t('teacherExams.examTitle')}</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required placeholder={t('teacherExams.examTitlePlaceholder')} />
          </div>
          
          <div className="form-group">
            <label>{t('teacherExams.targetClass')}</label>
            <select className="input-field" value={targetClass} onChange={e => setTargetClass(e.target.value)} required>
              <option value="">{t('teacherExams.selectClass')}</option>
              {classesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{t('teacherExams.subject')}</label>
            <select className="input-field" value={subject} onChange={e => setSubject(e.target.value)} required>
              <option value="">{t('teacherExams.selectSubject')}</option>
              {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{t('teacherExams.examDate')}</label>
            <input type="date" className="input-field" value={examDate} onChange={e => setExamDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>{t('teacherExams.startTime')}</label>
            <input type="time" className="input-field" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>{t('teacherExams.durationMinutes')}</label>
            <input type="number" min="1" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} required />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label>{t('teacherExams.numQuestions')}</label>
          <input type="number" min="1" max="50" className="input-field" style={{ width: '150px' }} value={numQuestions} onChange={e => setNumQuestions(e.target.value)} required />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--color-primary-light)', paddingBottom: '8px', display: 'inline-block' }}>{t('teacherExams.question')} {qIndex + 1}</h3>
              
              <MarkdownInput 
                label={t('teacherExams.questionText')}
                value={q.text}
                onChange={(val) => updateQuestion(qIndex, 'text', val)}
                placeholder={t('teacherExams.questionTextPlaceholder')}
                height="150px"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                {[0, 1, 2, 3].map(optIndex => (
                  <div key={optIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: q.correctOption === optIndex ? 'rgba(37, 211, 102, 0.1)' : 'transparent', padding: '12px', borderRadius: '8px', border: q.correctOption === optIndex ? '2px solid #25D366' : '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ margin: 0, fontWeight: 'bold' }}>{t('teacherExams.option')} {optIndex + 1}</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer', color: q.correctOption === optIndex ? '#25D366' : 'inherit' }}>
                        <input 
                          type="radio" 
                          name={`correct_${qIndex}`} 
                          checked={q.correctOption === optIndex} 
                          onChange={() => updateQuestion(qIndex, 'correctOption', optIndex)}
                        />
                        {t('teacherExams.correctAnswer')}
                      </label>
                    </div>
                    <MarkdownInput 
                      label=""
                      value={q.options[optIndex]}
                      onChange={(val) => updateOption(qIndex, optIndex, val)}
                      placeholder={`${t('teacherExams.option')} ${optIndex + 1}...`}
                      height="100px"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isSaving}>
            <Save size={20} />
            {isSaving ? t('teacherExams.saving') : t('teacherExams.saveExam')}
          </button>
        </div>
      </form>
    </div>
  );
}
