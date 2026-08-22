import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  Clock, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart2, 
  Printer, 
  PieChart, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  Award, 
  Search, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import MarkdownInput from '../components/MarkdownInput';
import { useLanguage } from '../contexts/LanguageContext';
import PrintExamModal from '../components/PrintExamModal';

export default function TeacherExams() {
  const { t } = useLanguage();
  const { userData } = useAuth();
  const [exams, setExams] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [teacherDocId, setTeacherDocId] = useState(null);
  
  // Views: 'list' | 'create' | 'edit' | 'item_analysis' | 'results_analytics'
  const [activeView, setActiveView] = useState('list');
  
  // Form State
  const [currentExam, setCurrentExam] = useState(null);
  const [title, setTitle] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [entryDeadline, setEntryDeadline] = useState('');
  const [duration, setDuration] = useState('45');
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([]);
  
  // Results & Analytics state
  const [examResults, setExamResults] = useState([]);
  const [studentsCache, setStudentsCache] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [printingExamData, setPrintingExamData] = useState(null);
  const [printingResultsData, setPrintingResultsData] = useState(null);
  
  // Results Analytics sub-tab: 'class' | 'student'
  const [analyticsTab, setAnalyticsTab] = useState('class');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [trackingStudent, setTrackingStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [inspectingStudentAnswers, setInspectingStudentAnswers] = useState(null);

  // Get teacher ID & subjects
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

  // Fetch classes
  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
      setClassesList(classesSnap.docs.map(d => d.data().name));
    });
    return () => unsubClasses();
  }, []);

  // Fetch exams for this teacher
  useEffect(() => {
    if (!teacherDocId) return;
    const q = query(collection(db, 'exams'), where('teacherId', '==', teacherDocId));
    const unsub = onSnapshot(q, snap => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(`${b.examDate}T${b.startTime}`) - new Date(`${a.examDate}T${a.startTime}`));
      setExams(data);
    });
    return () => unsub();
  }, [teacherDocId]);

  // Fetch students dictionary cache
  useEffect(() => {
    getDocs(collection(db, 'students')).then(snap => {
      const cache = {};
      snap.forEach(d => {
        cache[d.id] = d.data().name;
        if (d.data().nationalId) cache[d.data().nationalId] = d.data().name;
      });
      setStudentsCache(cache);
    });
  }, []);

  // Handle Question numbers synchronization
  useEffect(() => {
    if (activeView === 'list' || activeView === 'item_analysis' || activeView === 'results_analytics') return;
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

  const calculateDefaultCutoff = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '';
    const totalMins = parts[0] * 60 + parts[1] + 30;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const resetForm = () => {
    setCurrentExam(null);
    setTitle('');
    setTargetClass(classesList[0] || '');
    setSubject(subjectsList[0] || '');
    setExamDate('');
    setStartTime('');
    setEntryDeadline('');
    setDuration('45');
    setNumQuestions(1);
    setQuestions([]);
    setActiveView('list');
    setExamResults([]);
    setTrackingStudent(null);
    setInspectingStudentAnswers(null);
  };

  const handleEdit = (exam) => {
    setCurrentExam(exam);
    setTitle(exam.title);
    setTargetClass(exam.targetClass);
    setSubject(exam.subject);
    setExamDate(exam.examDate);
    setStartTime(exam.startTime);
    setEntryDeadline(exam.entryDeadline || calculateDefaultCutoff(exam.startTime));
    setDuration(exam.duration);
    setNumQuestions(exam.questions.length);
    setQuestions(exam.questions);
    setActiveView('edit');
  };

  // 1. Open Item Analysis (تحليل بنود ومفردات الاختبار)
  const handleOpenItemAnalysis = async (exam) => {
    setCurrentExam(exam);
    setActiveView('item_analysis');
    const q = query(collection(db, 'exam_results'), where('examId', '==', exam.id));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    setExamResults(results);
  };

  // 2. Open Results Analytics (تحليل نتائج الاختبار على مستوى الفصل والطالب)
  const handleOpenResultsAnalytics = async (exam) => {
    setCurrentExam(exam);
    setActiveView('results_analytics');
    setAnalyticsTab('class');
    const q = query(collection(db, 'exam_results'), where('examId', '==', exam.id));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach(d => results.push({ id: d.id, ...d.data() }));
    setExamResults(results);
  };

  const handleTrackStudent = async (studentId) => {
    setTrackingStudent(studentId);
    const q = query(collection(db, 'exam_results'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    
    const teacherExamIds = exams.map(e => e.id);
    const history = [];
    
    snap.forEach(d => {
      const data = d.data();
      if (teacherExamIds.includes(data.examId)) {
        const examDetails = exams.find(e => e.id === data.examId);
        history.push({
          ...data,
          examTitle: examDetails?.title,
          examDate: examDetails?.examDate
        });
      }
    });
    
    history.sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
    setStudentHistory(history);
  };

  const handleDelete = async (examId) => {
    if (window.confirm(t('teacherExams.confirmDelete'))) {
      await deleteDoc(doc(db, 'exams', examId));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!teacherDocId) return;
    
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
    const finalCutoff = entryDeadline || calculateDefaultCutoff(startTime);
    const examData = {
      teacherId: teacherDocId,
      title,
      targetClass,
      subject,
      examDate,
      startTime,
      entryDeadline: finalCutoff,
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

  // ==========================================
  // PSYCHOMETRIC & ITEM ANALYSIS CALCULATIONS
  // ==========================================
  const itemAnalysisData = useMemo(() => {
    if (!currentExam || !currentExam.questions || examResults.length === 0) {
      return null;
    }

    const N = examResults.length;
    const K = currentExam.questions.length;
    const sortedResults = [...examResults].sort((a, b) => b.score - a.score);

    const groupSize = N >= 20 ? Math.max(1, Math.round(N * 0.27)) : Math.max(1, Math.floor(N / 2));
    const upperGroup = sortedResults.slice(0, groupSize);
    const lowerGroup = sortedResults.slice(N - groupSize);

    let sumP = 0;
    let sumPItemVariance = 0;

    const questionsAnalysis = currentExam.questions.map((q, qIndex) => {
      let totalCorrect = 0;
      let upperCorrect = 0;
      let lowerCorrect = 0;
      const optionCounts = [0, 0, 0, 0];
      const upperOptionCounts = [0, 0, 0, 0];
      const lowerOptionCounts = [0, 0, 0, 0];

      examResults.forEach(res => {
        const studentAns = res.answers ? parseInt(res.answers[qIndex]) : -1;
        if (studentAns >= 0 && studentAns < 4) {
          optionCounts[studentAns]++;
        }
        if (studentAns === q.correctOption) {
          totalCorrect++;
        }
      });

      upperGroup.forEach(res => {
        const ans = res.answers ? parseInt(res.answers[qIndex]) : -1;
        if (ans >= 0 && ans < 4) upperOptionCounts[ans]++;
        if (ans === q.correctOption) upperCorrect++;
      });

      lowerGroup.forEach(res => {
        const ans = res.answers ? parseInt(res.answers[qIndex]) : -1;
        if (ans >= 0 && ans < 4) lowerOptionCounts[ans]++;
        if (ans === q.correctOption) lowerCorrect++;
      });

      // Difficulty Index P = Correct / N
      const p = totalCorrect / N;
      sumP += p;
      sumPItemVariance += (p * (1 - p));

      // Discrimination Index D = (Ru - Rl) / groupSize
      const d = groupSize > 0 ? (upperCorrect - lowerCorrect) / groupSize : 0;

      // Difficulty Category
      let diffCategory = 'متوازن ومثالي';
      let diffColor = '#16a34a';
      let diffBg = '#dcfce7';
      if (p > 0.85) {
        diffCategory = 'سهل جداً';
        diffColor = '#2563eb';
        diffBg = '#dbeafe';
      } else if (p < 0.30) {
        diffCategory = 'صعب جداً';
        diffColor = '#dc2626';
        diffBg = '#fee2e2';
      }

      // Discrimination Category
      let discCategory = 'تمييز ممتاز';
      let discColor = '#16a34a';
      let discBg = '#dcfce7';
      if (d >= 0.40) {
        discCategory = 'تمييز ممتاز (D ≥ 0.40)';
        discColor = '#16a34a';
        discBg = '#dcfce7';
      } else if (d >= 0.30) {
        discCategory = 'تمييز جيد (0.30 - 0.39)';
        discColor = '#0284c7';
        discBg = '#e0f2fe';
      } else if (d >= 0.20) {
        discCategory = 'تمييز مقبول (0.20 - 0.29)';
        discColor = '#d97706';
        discBg = '#fef3c7';
      } else {
        discCategory = 'تمييز ضعيف / يحتاج مراجعة (D < 0.20)';
        discColor = '#dc2626';
        discBg = '#fee2e2';
      }

      // Distractor Evaluation
      const distractors = q.options.map((optText, optIdx) => {
        const isCorrect = optIdx === q.correctOption;
        const count = optionCounts[optIdx];
        const pct = Math.round((count / N) * 100);
        const uCount = upperOptionCounts[optIdx];
        const lCount = lowerOptionCounts[optIdx];

        let note = '';
        if (!isCorrect) {
          if (count === 0) {
            note = 'مشتت غير فعال (لم يختره أحد)';
          } else if (uCount > lCount) {
            note = 'مشتت جذاب مضلل (جذب المتفوقين أكثر)';
          } else {
            note = 'مشتت فعال ومناسب';
          }
        }

        return {
          optIndex: optIdx,
          text: optText,
          isCorrect,
          count,
          pct,
          uCount,
          lCount,
          note
        };
      });

      let recommendation = 'سؤال صالح وممتاز، يُنصح بحفظه في بنك الأسئلة.';
      if (d < 0.20 && p > 0.85) {
        recommendation = 'السؤال مباشر وسهل جداً، يفضل تعميق مستوى الصعوبة لقياس مهارات تفكير أعلى.';
      } else if (d < 0.20 && p < 0.30) {
        recommendation = 'السؤال شديد الصعوبة أو غامض، يرجى مراجعة الصياغة ومناسبة البدائل.';
      } else if (d < 0.15) {
        recommendation = 'معامل التمييز منخفض، يُنصح بتنقيح المشتتات والخيارات.';
      }

      return {
        qIndex,
        question: q,
        totalCorrect,
        p,
        d,
        diffCategory,
        diffColor,
        diffBg,
        discCategory,
        discColor,
        discBg,
        distractors,
        recommendation
      };
    });

    const rawScores = examResults.map(r => r.score);
    const meanRaw = rawScores.reduce((a, b) => a + b, 0) / N;
    const varRaw = rawScores.reduce((a, b) => a + Math.pow(b - meanRaw, 2), 0) / N;
    const stdDev = Math.sqrt(varRaw);

    let kr20 = 0;
    if (K > 1 && varRaw > 0) {
      const alpha = (K / (K - 1)) * (1 - (sumPItemVariance / varRaw));
      kr20 = Math.max(0, Math.min(1, alpha));
    }
    const validity = Math.sqrt(kr20);
    const sem = stdDev * Math.sqrt(Math.max(0, 1 - kr20));
    const meanDifficulty = sumP / K;

    return {
      totalStudents: N,
      totalQuestions: K,
      meanScore: meanRaw.toFixed(1),
      stdDev: stdDev.toFixed(2),
      kr20: kr20.toFixed(2),
      validity: validity.toFixed(2),
      sem: sem.toFixed(2),
      meanDifficulty: meanDifficulty.toFixed(2),
      questionsAnalysis
    };
  }, [currentExam, examResults]);

  // ==========================================
  // RESULTS ANALYTICS (CLASS & STUDENT LEVEL)
  // ==========================================
  const resultsAnalyticsData = useMemo(() => {
    if (!currentExam || examResults.length === 0) return null;

    const total = examResults.length;
    let sumScores = 0;
    let passed = 0;
    let highest = 0;
    let lowest = 100;

    const bands = {
      excellent: { label: 'ممتاز (90% - 100%)', count: 0, color: '#16a34a', bg: '#dcfce7' },
      veryGood: { label: 'جيد جداً (80% - 89%)', count: 0, color: '#0284c7', bg: '#e0f2fe' },
      good: { label: 'جيد (70% - 79%)', count: 0, color: '#0d9488', bg: '#ccfbf1' },
      pass: { label: 'مقبول (60% - 69%)', count: 0, color: '#d97706', bg: '#fef3c7' },
      fail: { label: 'دون المقبول (< 60%)', count: 0, color: '#dc2626', bg: '#fee2e2' }
    };

    const studentRows = examResults.map(res => {
      const pct = Math.round((res.score / res.totalQuestions) * 100);
      sumScores += pct;
      if (pct >= 50) passed++;
      if (pct > highest) highest = pct;
      if (pct < lowest) lowest = pct;

      if (pct >= 90) bands.excellent.count++;
      else if (pct >= 80) bands.veryGood.count++;
      else if (pct >= 70) bands.good.count++;
      else if (pct >= 60) bands.pass.count++;
      else bands.fail.count++;

      const correctIndices = [];
      const incorrectIndices = [];
      currentExam.questions?.forEach((q, idx) => {
        const studentPick = res.answers ? parseInt(res.answers[idx]) : -1;
        if (studentPick === q.correctOption) {
          correctIndices.push(idx + 1);
        } else {
          incorrectIndices.push(idx + 1);
        }
      });

      return {
        id: res.id,
        studentId: res.studentId,
        studentName: studentsCache[res.studentId] || 'طالب',
        score: res.score,
        totalQuestions: res.totalQuestions,
        percentage: pct,
        isPass: pct >= 50,
        correctIndices,
        incorrectIndices,
        rawResult: res,
        timestamp: res.timestamp
      };
    });

    const average = Math.round(sumScores / total);
    const passRate = Math.round((passed / total) * 100);

    studentRows.sort((a, b) => b.percentage - a.percentage);
    studentRows.forEach((s, idx) => {
      s.rank = idx + 1;
      if (s.percentage > average + 5) s.comparison = 'فوق المتوسط 🚀';
      else if (s.percentage >= average - 5) s.comparison = 'في مستوى المتوسط ⚖️';
      else s.comparison = 'دون المتوسط (يحتاج دعم) ⚠️';
    });

    return {
      total,
      average,
      passRate,
      highest,
      lowest,
      bands,
      studentRows
    };
  }, [currentExam, examResults, studentsCache]);

  // ==========================================
  // 1. ITEM ANALYSIS VIEW (تحليل الاختبار)
  // ==========================================
  if (activeView === 'item_analysis' && currentExam) {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid rgba(0,0,0,0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={26} color="#0e7490" /> تقرير التحليل السيكومتري ومفردات الاختبار: {currentExam.title}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              الفصل: <strong>{currentExam.targetClass}</strong> | المادة: <strong>{currentExam.subject}</strong> | عدد الأسئلة: <strong>{currentExam.questions.length}</strong> | المختبرين: <strong>{examResults.length}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #0e7490, #63B2C6)', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => window.print()}
            >
              <Printer size={16} /> طباعة تقرير التحليل (PDF)
            </button>
            <button className="btn btn-outline" onClick={resetForm}>
              <ArrowRight size={16} /> العودة للاختبارات
            </button>
          </div>
        </div>

        {examResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
            <h3>لا توجد نتائج مسجلة لهذا الاختبار حتى الآن</h3>
            <p>سيتم توليد التحليل السيكومتري تلقائياً فور قيام الطلاب بحل الاختبار وتسليمه.</p>
          </div>
        ) : itemAnalysisData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Overall Psychometric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>معامل الثبات (KR-20)</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#15803d', margin: '4px 0' }}>{itemAnalysisData.kr20}</div>
                <div style={{ fontSize: '11px', color: '#166534' }}>{parseFloat(itemAnalysisData.kr20) >= 0.70 ? '✅ ثبات عالي وموثوق' : '⚠️ ثبات متوسط'}</div>
              </div>

              <div style={{ background: '#f0fdfa', padding: '16px', borderRadius: '10px', border: '1px solid #99f6e4', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f766e' }}>معامل الصدق الذاتي</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0d9488', margin: '4px 0' }}>{itemAnalysisData.validity}</div>
                <div style={{ fontSize: '11px', color: '#0f766e' }}>جذر معامل الثبات (√KR-20)</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>متوسط صعوبة الاختبار</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', margin: '4px 0' }}>{itemAnalysisData.meanDifficulty}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>المعدل المثالي (0.40 - 0.75)</div>
              </div>

              <div style={{ background: '#fdf4ff', padding: '16px', borderRadius: '10px', border: '1px solid #f5d0fe', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#86198f' }}>الانحراف المعياري (Sx)</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#a21caf', margin: '4px 0' }}>{itemAnalysisData.stdDev}</div>
                <div style={{ fontSize: '11px', color: '#86198f' }}>تشتت درجات الطلاب</div>
              </div>

              <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>خطأ القياس المعياري (SEM)</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#b45309', margin: '4px 0' }}>{itemAnalysisData.sem}</div>
                <div style={{ fontSize: '11px', color: '#92400e' }}>دقة تقدير الدرجة الحقيقية</div>
              </div>
            </div>

            {/* Questions Detailed Analysis Table & Cards */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="#0e7490" /> جدول تحليل مفردات وبنود الأسئلة (Item Psychometrics)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {itemAnalysisData.questionsAnalysis.map((item, idx) => (
                  <div key={item.qIndex} style={{ background: '#f8fafc', padding: '18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginInlineEnd: '8px' }}>
                          السؤال {idx + 1}
                        </span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.question.text}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: item.diffBg, color: item.diffColor, border: `1px solid ${item.diffColor}40` }}>
                          معامل السهولة P: {item.p.toFixed(2)} ({item.diffCategory})
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: item.discBg, color: item.discColor, border: `1px solid ${item.discColor}40` }}>
                          معامل التمييز D: {item.d.toFixed(2)} ({item.discCategory})
                        </span>
                      </div>
                    </div>

                    {/* Distractor Choices Frequency Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
                      {item.distractors.map((d) => (
                        <div
                          key={d.optIndex}
                          style={{
                            background: d.isCorrect ? '#f0fdf4' : 'white',
                            border: `1.5px solid ${d.isCorrect ? '#22c55e' : '#cbd5e1'}`,
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: d.isCorrect ? '#166534' : '#334155' }}>
                              الخيار {d.optIndex + 1} {d.isCorrect && '✅ (الإجابة الصحيحة)'}
                            </strong>
                            <span style={{ fontWeight: 'bold', color: d.isCorrect ? '#166534' : '#64748b' }}>
                              {d.count} طلاب ({d.pct}%)
                            </span>
                          </div>
                          <div style={{ color: '#475569', fontSize: '12px', marginBottom: '6px' }}>{d.text}</div>
                          {d.note && (
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: d.note.includes('مضلل') ? '#dc2626' : d.note.includes('غير فعال') ? '#d97706' : '#16a34a' }}>
                              💡 {d.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pedagogical Recommendation */}
                    <div style={{ marginTop: '12px', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Sparkles size={16} color="#0e7490" />
                      <span><strong>التوصية التربوية:</strong> {item.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. RESULTS ANALYTICS VIEW (تحليل النتائج على مستوى الفصل ومستوى الطالب)
  // =========================================================================
  if (activeView === 'results_analytics' && currentExam) {
    const data = resultsAnalyticsData;

    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid rgba(0,0,0,0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={26} color="#0e7490" /> تحليل نتائج الاختبار: {currentExam.title}
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              الفصل: <strong>{currentExam.targetClass}</strong> | المادة: <strong>{currentExam.subject}</strong> | التاريخ: <strong>{currentExam.examDate}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #0e7490, #63B2C6)', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setPrintingResultsData({ exam: currentExam, results: examResults })}
            >
              <Printer size={16} /> طباعة وتصدير كشف النتائج (Word/PDF)
            </button>
            <button className="btn btn-outline" onClick={resetForm}>
              <ArrowRight size={16} /> العودة للاختبارات
            </button>
          </div>
        </div>

        {/* Tab Switcher: Class Level vs Student Level */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setAnalyticsTab('class')}
            className="btn"
            style={{
              flex: 1,
              padding: '12px',
              background: analyticsTab === 'class' ? 'var(--color-primary-dark)' : 'white',
              color: analyticsTab === 'class' ? 'white' : 'var(--color-primary-dark)',
              border: '1px solid var(--color-border)',
              fontWeight: 'bold',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} /> 1. تحليل النتائج على مستوى الفصل
          </button>

          <button
            onClick={() => setAnalyticsTab('student')}
            className="btn"
            style={{
              flex: 1,
              padding: '12px',
              background: analyticsTab === 'student' ? 'var(--color-primary-dark)' : 'white',
              color: analyticsTab === 'student' ? 'white' : 'var(--color-primary-dark)',
              border: '1px solid var(--color-border)',
              fontWeight: 'bold',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Award size={18} /> 2. تحليل النتائج على مستوى الطالب
          </button>
        </div>

        {!data || data.total === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-text-muted)', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
            <h3>لا توجد نتائج مسجلة لهذا الاختبار بعد</h3>
          </div>
        ) : (
          <>
            {/* ===================================== */}
            {/* SUB-TAB 1: CLASS LEVEL ANALYTICS      */}
            {/* ===================================== */}
            {analyticsTab === 'class' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>عدد المختبرين</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>{data.total} طالب</div>
                  </div>

                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>متوسط الفصل</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: data.average >= 50 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>{data.average}%</div>
                  </div>

                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>نسبة النجاح</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: data.passRate >= 50 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>{data.passRate}%</div>
                  </div>

                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>أعلى درجة</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>{data.highest}%</div>
                  </div>

                  <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>أدنى درجة</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>{data.lowest}%</div>
                  </div>
                </div>

                {/* Grade Bands & Distribution Bars */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={20} color="#0e7490" /> توزيع مستويات أداء طلاب الفصل (Performance Distribution)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(data.bands).map(([key, band]) => {
                      const pct = data.total > 0 ? Math.round((band.count / data.total) * 100) : 0;

                      return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                            <span style={{ color: band.color }}>{band.label}</span>
                            <span style={{ color: '#334155' }}>{band.count} طالب ({pct}%)</span>
                          </div>
                          <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: band.color,
                                borderRadius: '10px',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ===================================== */}
            {/* SUB-TAB 2: STUDENT LEVEL ANALYTICS    */}
            {/* ===================================== */}
            {analyticsTab === 'student' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="بحث باسم الطالب..."
                      value={studentSearchQuery}
                      onChange={e => setStudentSearchQuery(e.target.value)}
                      style={{ paddingRight: '36px', marginBottom: 0 }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    إجمالي الطلاب: <strong>{data.studentRows.length}</strong> | متوسط الفصل: <strong>{data.average}%</strong>
                  </div>
                </div>

                {/* Students Table */}
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 14px', fontSize: '13px', width: '50px' }}>الرتبة</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px' }}>اسم الطالب</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>الدرجة</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>النسبة</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>المستوى بالنسبة للمتوسط</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>نقاط القوة / الضعف</th>
                        <th style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'center' }}>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.studentRows
                        .filter(s => !studentSearchQuery || s.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                        .map((student, idx) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 'bold' }}>
                              {student.rank === 1 ? '🥇 1' : student.rank === 2 ? '🥈 2' : student.rank === 3 ? '🥉 3' : student.rank}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0f172a' }}>
                              {student.studentName}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 'bold' }}>
                              {student.score} / {student.totalQuestions}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 'bold', color: student.isPass ? '#16a34a' : '#dc2626' }}>
                              {student.percentage}%
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                              {student.comparison}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '12px' }}>
                              <span style={{ color: '#16a34a', marginInlineEnd: '8px' }}>
                                صحيحة: {student.correctIndices.length}
                              </span>
                              <span style={{ color: '#dc2626' }}>
                                خاطئة: {student.incorrectIndices.length}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => setInspectingStudentAnswers(student)}
                                  title="فحص إجابات الطالب"
                                >
                                  فحص الحل
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleTrackStudent(student.studentId)}
                                  title="تتبع مستوى الطالب عبر الاختبارات"
                                >
                                  <TrendingUp size={13} /> تتبع
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </>
        )}

        {/* Modal: Student Inspection */}
        {inspectingStudentAnswers && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>
                  إجابات الطالب: {inspectingStudentAnswers.studentName} ({inspectingStudentAnswers.score} / {inspectingStudentAnswers.totalQuestions})
                </h3>
                <button className="btn btn-outline" onClick={() => setInspectingStudentAnswers(null)}>إغلاق</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentExam.questions?.map((q, qIdx) => {
                  const studentAnswer = inspectingStudentAnswers.rawResult?.answers?.[qIdx];
                  const isCorrect = studentAnswer === q.correctOption;

                  return (
                    <div key={q.id || qIdx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: `1px solid ${isCorrect ? '#86efac' : '#fca5a5'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong>السؤال {qIdx + 1}: {q.text}</strong>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: isCorrect ? '#166534' : '#991b1b' }}>
                          {isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة خاطئة'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        {q.options?.map((opt, optIdx) => {
                          const isStudentPick = studentAnswer === optIdx;
                          const isTheCorrectOne = q.correctOption === optIdx;

                          let bg = '#fff';
                          let border = '#e2e8f0';
                          if (isTheCorrectOne) {
                            bg = '#dcfce7';
                            border = '#22c55e';
                          } else if (isStudentPick && !isCorrect) {
                            bg = '#fee2e2';
                            border = '#ef4444';
                          }

                          return (
                            <div key={optIdx} style={{ padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: '6px' }}>
                              {opt} {isTheCorrectOne ? ' (الإجابة الصحيحة)' : ''} {isStudentPick ? ' (اختيار الطالب)' : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Student History Tracking */}
        {trackingStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0 }}><TrendingUp size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> سجل تتبع تطور الطالب: {studentsCache[trackingStudent]}</h3>
                <button className="btn btn-outline" onClick={() => setTrackingStudent(null)}>إغلاق</button>
              </div>
              
              {studentHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>لا توجد اختبارات سابقة لهذا الطالب في موادك.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>الاختبار</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>التاريخ</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>الدرجة</th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>النسبة والتطور</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((h, i) => {
                      const pct = Math.round((h.score / h.totalQuestions) * 100);
                      let trend = null;
                      if (i > 0) {
                        const prevPct = Math.round((studentHistory[i-1].score / studentHistory[i-1].totalQuestions) * 100);
                        if (pct > prevPct) trend = <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>▲ (+{pct - prevPct}%)</span>;
                        else if (pct < prevPct) trend = <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>▼ ({pct - prevPct}%)</span>;
                        else trend = <span style={{ color: '#64748b', fontSize: '12px' }}>◀▶ (0%)</span>;
                      }
                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{h.examTitle}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>{h.examDate}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{h.score} / {h.totalQuestions}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <span style={{ color: pct >= 50 ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{pct}%</span>
                              {trend}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {printingResultsData && (
          <PrintExamModal 
            exam={printingResultsData.exam} 
            results={printingResultsData.results} 
            studentsCache={studentsCache} 
            mode="results" 
            onClose={() => setPrintingResultsData(null)} 
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN LIST VIEW (بطاقات الاختبارات مع زري التحليل)
  // =========================================================================
  if (activeView === 'list') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0' }}><FileText style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} /> {t('teacherExams.electronicExams')}</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              إدارة الاختبارات الإلكترونية، تحليل مفردات وبنود الاختبار، وتحليل النتائج على مستوى الفصل والطالب
            </p>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {exams.map(exam => (
              <div key={exam.id} style={{ background: 'rgba(255,255,255,0.85)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{exam.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16}/> {t('teacherExams.classLabel')} <strong>{exam.targetClass}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={16}/> {t('teacherExams.subjectLabel')} <strong>{exam.subject}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> {t('teacherExams.timeLabel')} {exam.examDate} | {exam.startTime} ({exam.duration} {t('teacherExams.minutes')})</div>
                  <div style={{ fontSize: '12px', color: '#0e7490', background: 'rgba(14, 116, 144, 0.08)', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⏳ آخر موعد للدخول: <strong>{exam.entryDeadline || calculateDefaultCutoff(exam.startTime)}</strong>
                  </div>
                  <div>{t('teacherExams.questionsCount')} <strong>{exam.questions.length} أسئلة</strong></div>
                </div>
                
                {/* Analysis Action Buttons */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* Button 1: Item & Exam Analysis */}
                    <button 
                      className="btn btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', padding: '10px 8px', fontWeight: 'bold' }} 
                      onClick={() => handleOpenItemAnalysis(exam)}
                      title="تحليل مفردات وفقرات الاختبار ومعاملات الصعوبة والتمييز والصدق والثبات"
                    >
                      <Activity size={16} /> تحليل الاختبار
                    </button>

                    {/* Button 2: Results Analytics (Class & Student level) */}
                    <button 
                      className="btn" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', padding: '10px 8px', background: 'linear-gradient(135deg, #0e7490, #63B2C6)', color: 'white', border: 'none', fontWeight: 'bold' }} 
                      onClick={() => handleOpenResultsAnalytics(exam)}
                      title="تحليل نتائج الاختبار على مستوى الفصل وعلى مستوى الطالب"
                    >
                      <BarChart2 size={16} /> تحليل نتائج الاختبار
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '6px' }} 
                      onClick={() => setPrintingExamData(exam)}
                      title="طباعة وتصدير أسئلة الاختبار بصيغة Word و PDF"
                    >
                      <Printer size={14} /> طباعة الأسئلة (Word/PDF)
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px' }} 
                      onClick={() => handleEdit(exam)}
                      title="تعديل الاختبار"
                    >
                      <Edit size={14} /> {t('teacherExams.edit')}
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: '#fca5a5', padding: '6px 10px' }} 
                      onClick={() => handleDelete(exam.id)}
                      title="حذف الاختبار"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {printingExamData && (
          <PrintExamModal exam={printingExamData} mode="exam" onClose={() => setPrintingExamData(null)} />
        )}
      </div>
    );
  }

  // =========================================================================
  // CREATE / EDIT FORM
  // =========================================================================
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '16px' }}>
        <h2>{activeView === 'create' ? t('teacherExams.createExam') : t('teacherExams.editExam')}</h2>
        <button className="btn btn-outline" onClick={resetForm}>{t('teacherExams.backToList')}</button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
            <input 
              type="time" 
              className="input-field" 
              value={startTime} 
              onChange={e => {
                const val = e.target.value;
                setStartTime(val);
                if (!entryDeadline || entryDeadline === calculateDefaultCutoff(startTime)) {
                  setEntryDeadline(calculateDefaultCutoff(val));
                }
              }} 
              required 
            />
          </div>

          <div className="form-group">
            <label>
              آخر موعد لسماح الدخول
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-primary-dark)', marginInlineStart: '4px' }}>
                (تلقائياً 30 دقيقة من البدء)
              </span>
            </label>
            <input 
              type="time" 
              className="input-field" 
              value={entryDeadline} 
              onChange={e => setEntryDeadline(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>{t('teacherExams.durationMinutes')}</label>
            <input type="number" min="1" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>{t('teacherExams.numQuestions')}</label>
            <input type="number" min="1" max="50" className="input-field" value={numQuestions} onChange={e => setNumQuestions(e.target.value)} required />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {questions.map((q, qIndex) => (
            <div key={q.id || qIndex} style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
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
