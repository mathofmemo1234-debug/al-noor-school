import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Clock, Play, CheckCircle, Printer } from 'lucide-react';
import MarkdownViewer from '../components/MarkdownViewer';
import { useLanguage } from '../contexts/LanguageContext';
import PrintExamModal from '../components/PrintExamModal';

export default function StudentExams() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [exams, setExams] = useState([]);
  const [studentClass, setStudentClass] = useState('');
  const [studentDocId, setStudentDocId] = useState(null);
  const [examResults, setExamResults] = useState({});
  
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreView, setScoreView] = useState(null);
  const [printingExamResult, setPrintingExamResult] = useState(null);

  // Fetch student info
  useEffect(() => {
    if (userData?.nationalId) {
      const q = query(collection(db, 'students'), where('nationalId', '==', userData.nationalId));
      const unsub = onSnapshot(q, snap => {
        if (!snap.empty) {
          setStudentClass(snap.docs[0].data().class);
          setStudentDocId(snap.docs[0].id);
        }
      });
      return () => unsub();
    }
  }, [userData]);

  // Fetch exams for this class
  useEffect(() => {
    if (!studentClass) return;
    const q = query(collection(db, 'exams'), where('targetClass', '==', studentClass));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      // Sort by date descending
      data.sort((a, b) => new Date(`${b.examDate}T${b.startTime}`) - new Date(`${a.examDate}T${a.startTime}`));
      setExams(data);
    });
    return () => unsub();
  }, [studentClass]);

  // Fetch student's past results
  useEffect(() => {
    if (!studentDocId) return;
    const q = query(collection(db, 'exam_results'), where('studentId', '==', studentDocId));
    const unsub = onSnapshot(q, snap => {
      const resultsMap = {};
      snap.forEach(d => {
        const data = d.data();
        resultsMap[data.examId] = data;
      });
      setExamResults(resultsMap);
    });
    return () => unsub();
  }, [studentDocId]);

  const canTakeExam = (exam) => {
    if (examResults[exam.id]) return false; // Already taken
    const now = new Date();
    const examStart = new Date(`${exam.examDate}T${exam.startTime}`);
    // If now is >= examStart, they can take it (assuming we don't block them if they're late, or maybe we do? We just let them in if it's past start time).
    return now >= examStart;
  };

  const isExamUpcoming = (exam) => {
    if (examResults[exam.id]) return false;
    const now = new Date();
    const examStart = new Date(`${exam.examDate}T${exam.startTime}`);
    return now < examStart;
  };

  const startExam = (exam) => {
    if (!canTakeExam(exam)) {
      alert(t('studentExams.cannotEnterNow'));
      return;
    }
    setActiveExam(exam);
    setAnswers({});
    setScoreView(null);
  };

  const submitExam = async () => {
    if (!activeExam || !studentDocId) return;
    
    // Check if all answered
    if (Object.keys(answers).length < activeExam.questions.length) {
      if (!window.confirm(t('studentExams.confirmIncompleteSubmit'))) {
        return;
      }
    }

    setIsSubmitting(true);
    let correctCount = 0;
    activeExam.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const resultData = {
      examId: activeExam.id,
      studentId: studentDocId,
      score: correctCount,
      totalQuestions: activeExam.questions.length,
      answers: answers,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'exam_results'), resultData);
      setScoreView({
        score: correctCount,
        total: activeExam.questions.length
      });
    } catch (err) {
      console.error(err);
      alert(t('studentExams.submitFail'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (scoreView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <CheckCircle size={64} color="#25D366" style={{ margin: '0 auto 20px auto' }} />
        <h2 style={{ color: 'var(--color-primary-dark)' }}>{t('studentExams.examDelivered')}</h2>
        <div style={{ fontSize: '24px', margin: '20px 0', background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
          {t('studentExams.grade')} <strong style={{ color: scoreView.score === scoreView.total ? '#25D366' : 'var(--color-primary)' }}>{scoreView.score}</strong> / {scoreView.total}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
          <button 
            className="btn" 
            style={{ background: 'linear-gradient(135deg, #0e7490, #63B2C6)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => setPrintingExamResult({
              exam: activeExam,
              results: [{
                studentId: studentDocId,
                score: scoreView.score,
                totalQuestions: scoreView.total,
                studentClass: studentClass,
                timestamp: new Date()
              }]
            })}
          >
            <Printer size={18} /> طباعة إشعار وشهادة النتيجة (Word/PDF)
          </button>
          <button className="btn btn-outline" onClick={() => { setActiveExam(null); setScoreView(null); }}>{t('studentExams.backToList')}</button>
        </div>

        {printingExamResult && (
          <PrintExamModal 
            exam={printingExamResult.exam} 
            results={printingExamResult.results}
            studentsCache={{ [studentDocId]: userData?.name || 'الطالب' }}
            mode="results"
            onClose={() => setPrintingExamResult(null)} 
          />
        )}
      </div>
    );
  }

  if (activeExam) {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '16px' }}>
          <h2>{activeExam.title}</h2>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            <Clock size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {t('studentExams.durationLabel')} {activeExam.duration} {t('studentExams.minutes')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {activeExam.questions.map((q, qIndex) => (
            <div key={q.id} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', flexShrink: 0 }}>
                  {qIndex + 1}
                </div>
                <div style={{ flex: 1, fontSize: '16px' }}>
                  <MarkdownViewer content={q.text} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingRight: '48px' }}>
                {q.options.map((optText, optIndex) => (
                  <label key={optIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '8px', border: answers[qIndex] === optIndex ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: answers[qIndex] === optIndex ? 'rgba(99,178,198,0.05)' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <input 
                      type="radio" 
                      name={`q_${qIndex}`} 
                      checked={answers[qIndex] === optIndex}
                      onChange={() => setAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                      style={{ marginTop: '4px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <MarkdownViewer content={optText} />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '12px 40px', fontSize: '18px' }} onClick={submitExam} disabled={isSubmitting}>
            {isSubmitting ? t('studentExams.submitting') : t('studentExams.submitExam')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}><FileText style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> {t('studentExams.exams')}</h2>
      
      {exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          {t('studentExams.noExamsAvailable')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {exams.map(exam => {
            const hasTaken = !!examResults[exam.id];
            const upcoming = isExamUpcoming(exam);
            const canTake = canTakeExam(exam);
            
            return (
              <div key={exam.id} style={{ background: 'rgba(255,255,255,0.7)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-primary-dark)' }}>{exam.title}</h3>
                <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>{t('studentExams.subjectLabel')} {exam.subject}</div>
                  <div>{t('studentExams.startTimeLabel')} {exam.examDate} {t('studentExams.hourLabel')} {exam.startTime}</div>
                  <div>{t('studentExams.durationMins')} {exam.duration} {t('studentExams.minutes')}</div>
                  <div>{t('studentExams.numQuestionsLabel')} {exam.questions.length}</div>
                </div>

                {hasTaken ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                      {t('studentExams.deliveredGrade')} {examResults[exam.id].score} / {examResults[exam.id].totalQuestions}
                    </div>
                    <button
                      className="btn"
                      style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => setPrintingExamResult({
                        exam,
                        results: [{
                          studentId: studentDocId,
                          score: examResults[exam.id].score,
                          totalQuestions: examResults[exam.id].totalQuestions,
                          studentClass: studentClass,
                          timestamp: examResults[exam.id].timestamp || new Date()
                        }]
                      })}
                    >
                      <Printer size={15} /> طباعة إشعار النتيجة (Word/PDF)
                    </button>
                  </div>
                ) : upcoming ? (
                  <div style={{ background: '#f1f5f9', color: '#64748b', padding: '12px', borderRadius: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Clock size={18} /> {t('studentExams.availableSoon')}
                  </div>
                ) : canTake ? (
                  <button className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={() => startExam(exam)}>
                    <Play size={18} /> {t('studentExams.startExam')}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {printingExamResult && (
        <PrintExamModal 
          exam={printingExamResult.exam} 
          results={printingExamResult.results}
          studentsCache={{ [studentDocId]: userData?.name || 'الطالب' }}
          mode="results"
          onClose={() => setPrintingExamResult(null)} 
        />
      )}
    </div>
  );
}
