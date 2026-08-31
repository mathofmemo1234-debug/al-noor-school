import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, BookOpen, FileText, CheckCircle, AlertTriangle, Calendar, Award, 
  BarChart2, Search, Filter, Printer, Download, Eye, Edit, Save, X, 
  ChevronRight, ChevronLeft, Star, Sparkles, CheckSquare, Clock, AlertCircle, 
  ArrowUpDown, TrendingUp, ShieldCheck, UserCheck, RefreshCw
} from 'lucide-react';
import GamificationBadge from '../components/GamificationBadge';
import { calculateStudentActivity } from '../utils/gamificationEngine';

export default function ComprehensiveStudentRecord({ role = 'teacher', targetStudentId = null }) {
  const { userData } = useAuth();
  const { t, lang } = useLanguage();

  const isRTL = lang === 'ar';
  const effectiveRole = role || userData?.role || 'teacher';
  const schoolId = userData?.schoolId || 'default_school_1';

  // Primary active view: 'matrix' (كشف الفصل الشامل) | 'student_dossier' (الملف الفردي للطالب) | 'analytics' (التقارير التحليلية والمؤشرات)
  const [activeView, setActiveView] = useState(effectiveRole === 'parent' ? 'student_dossier' : 'matrix');
  
  // Data State
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [subjectsList, setSubjectsList] = useState([]);
  
  const [attendanceDocs, setAttendanceDocs] = useState([]);
  const [exams, setExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentResults, setAssignmentResults] = useState([]);
  const [studentActivityMap, setStudentActivityMap] = useState({});
  const [customEvaluations, setCustomEvaluations] = useState({}); // studentId -> { participationScore, notes }
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_SUPPORT' | 'HIGH_ABSENCE'
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState(null);

  // Manual Attendance Editor Modal
  const [editingAttendanceStudent, setEditingAttendanceStudent] = useState(null);
  const [attendanceEditDate, setAttendanceEditDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceEditStatus, setAttendanceEditStatus] = useState('present'); // 'present' | 'absent' | 'late' | 'excused'
  const [attendanceEditNote, setAttendanceEditNote] = useState('');
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceEditSuccess, setAttendanceEditSuccess] = useState('');

  // Manual Participation/Evaluation Modal
  const [editingEvaluationStudent, setEditingEvaluationStudent] = useState(null);
  const [manualParticipationScore, setManualParticipationScore] = useState(10);
  const [manualEvaluationNotes, setManualEvaluationNotes] = useState('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  const [teacherDocId, setTeacherDocId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Resolve Teacher Document ID and Subject if Teacher
  useEffect(() => {
    if (userData?.nationalId && effectiveRole === 'teacher') {
      const q = query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId));
      const unsub = onSnapshot(q, snap => {
        if (!snap.empty) {
          setTeacherDocId(snap.docs[0].id);
          const subj = snap.docs[0].data().subject || '';
          if (subj) {
            setSubjectsList(subj.split('،').map(s => s.trim()).filter(Boolean));
          }
        } else if (!isNaN(userData.nationalId)) {
          const numQ = query(collection(db, 'teachers'), where('nationalId', '==', Number(userData.nationalId)));
          getDocs(numQ).then(numSnap => {
            if (!numSnap.empty) {
              setTeacherDocId(numSnap.docs[0].id);
              const subj = numSnap.docs[0].data().subject || '';
              if (subj) {
                setSubjectsList(subj.split('،').map(s => s.trim()).filter(Boolean));
              }
            }
          });
        }
      });
      return () => unsub();
    }
  }, [userData, effectiveRole]);

  // 2. Fetch Classes and Determine Assigned Classes for Teachers
  useEffect(() => {
    const qClasses = schoolId === 'ALL'
      ? collection(db, 'classes')
      : query(collection(db, 'classes'), where('schoolId', '==', schoolId));

    const unsubClasses = onSnapshot(qClasses, (classesSnap) => {
      const classMap = {};
      const allClassNames = [];
      classesSnap.docs.forEach(d => {
        classMap[d.id] = d.data().name;
        allClassNames.push(d.data().name);
      });
      setClassesList(allClassNames);

      // If teacher, resolve assigned classes from schedule
      if (effectiveRole === 'teacher') {
        const qSchedules = schoolId === 'ALL'
          ? collection(db, 'schedules')
          : query(collection(db, 'schedules'), where('schoolId', '==', schoolId));

        const unsubSchedules = onSnapshot(qSchedules, (schedulesSnap) => {
          const myAssigned = new Set();
          const tid = teacherDocId;
          const nid = userData?.nationalId;
          const tEmail = userData?.email;

          schedulesSnap.docs.forEach(docSnap => {
            const matrix = docSnap.data().matrix || {};
            let isTeaching = false;
            Object.values(matrix).forEach(cell => {
              if (cell && (cell.teacherId === tid || cell.teacherId === nid || cell.teacherEmail === tEmail)) {
                isTeaching = true;
              }
            });
            if (isTeaching && classMap[docSnap.id]) {
              myAssigned.add(classMap[docSnap.id]);
            }
          });

          // Fallback: If no schedule matrix found yet, check if teacher doc has classes or subjects
          const assignedArray = Array.from(myAssigned);
          if (assignedArray.length > 0) {
            setAssignedClasses(assignedArray);
            if (!selectedClass || !assignedArray.includes(selectedClass)) {
              setSelectedClass(assignedArray[0]);
            }
          } else {
            // If schedule not yet assigned, allow all school classes for safety
            setAssignedClasses(allClassNames);
            if (!selectedClass && allClassNames.length > 0) {
              setSelectedClass(allClassNames[0]);
            }
          }
        });
        return () => unsubSchedules();
      } else if (effectiveRole === 'parent') {
        const parentStudentClass = userData?.studentClass || '';
        if (parentStudentClass) {
          setAssignedClasses([parentStudentClass]);
          setSelectedClass(parentStudentClass);
        } else {
          setAssignedClasses(allClassNames);
          if (!selectedClass && allClassNames.length > 0) setSelectedClass(allClassNames[0]);
        }
      } else {
        // Admin, Staff, Supervisor
        setAssignedClasses(allClassNames);
        if (!selectedClass && allClassNames.length > 0) {
          setSelectedClass(allClassNames[0]);
        }
      }
    });

    return () => unsubClasses();
  }, [schoolId, effectiveRole, teacherDocId, userData]);

  // 3. Fetch All Relevant Realtime Collections (Students, Attendance, Exams, Exam Results, Assignments, Assignment Results, Custom Evaluations)
  useEffect(() => {
    const qStudents = schoolId === 'ALL'
      ? collection(db, 'students')
      : query(collection(db, 'students'), where('schoolId', '==', schoolId));

    const qAtt = schoolId === 'ALL'
      ? collection(db, 'attendance')
      : query(collection(db, 'attendance'), where('schoolId', '==', schoolId));

    const qExams = schoolId === 'ALL'
      ? collection(db, 'exams')
      : query(collection(db, 'exams'), where('schoolId', '==', schoolId));

    const qExamRes = schoolId === 'ALL'
      ? collection(db, 'exam_results')
      : query(collection(db, 'exam_results'), where('schoolId', '==', schoolId));

    const qAssign = schoolId === 'ALL'
      ? collection(db, 'assignments')
      : query(collection(db, 'assignments'), where('schoolId', '==', schoolId));

    const qAssignRes = schoolId === 'ALL'
      ? collection(db, 'assignment_results')
      : query(collection(db, 'assignment_results'), where('schoolId', '==', schoolId));

    const qEvaluations = schoolId === 'ALL'
      ? collection(db, 'student_evaluations')
      : query(collection(db, 'student_evaluations'), where('schoolId', '==', schoolId));

    const unsubStudents = onSnapshot(qStudents, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubAtt = onSnapshot(qAtt, snap => {
      setAttendanceDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubExams = onSnapshot(qExams, snap => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubExamRes = onSnapshot(qExamRes, snap => {
      setExamResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAssign = onSnapshot(qAssign, snap => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubAssignRes = onSnapshot(qAssignRes, snap => {
      setAssignmentResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubEvaluations = onSnapshot(qEvaluations, snap => {
      const evalMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.studentId) evalMap[data.studentId] = data;
        if (data.nationalId) evalMap[data.nationalId] = data;
      });
      setCustomEvaluations(evalMap);
    });

    return () => {
      unsubStudents();
      unsubAtt();
      unsubExams();
      unsubExamRes();
      unsubAssign();
      unsubAssignRes();
      unsubEvaluations();
    };
  }, [schoolId]);

  // 4. Compute Gamification and Student Activity Map
  useEffect(() => {
    if (students.length === 0) return;
    const aList = assignmentResults;
    const eList = examResults;
    const attList = attendanceDocs;

    const map = {};
    students.forEach(s => {
      map[s.id] = calculateStudentActivity({
        studentId: s.id,
        assignmentResults: aList,
        examResults: eList,
        attendanceDocs: attList
      });
    });
    setStudentActivityMap(map);
  }, [students, assignmentResults, examResults, attendanceDocs]);

  // 5. Build Comprehensive Data Record per Student
  const processedStudentRecords = useMemo(() => {
    if (!students || students.length === 0) return [];

    // Filter students by selectedClass
    let classStudents = students.filter(s => {
      const sClass = s.class || s.className || '';
      if (effectiveRole === 'parent') {
        const parentNid = (userData?.studentNationalId || userData?.nationalId || '').trim();
        const sNid = (s.nationalId || '').trim();
        const sName = (s.name || '').trim();
        const parentStudentName = (userData?.studentName || '').trim();
        return (parentNid && (sNid === parentNid || s.id === parentNid)) || 
               (parentStudentName && sName.includes(parentStudentName));
      }
      return selectedClass ? sClass.trim() === selectedClass.trim() : true;
    });

    // Process each student record
    return classStudents.map(student => {
      const sId = student.id;
      const sNid = (student.nationalId || '').trim();
      const sClass = student.class || student.className || selectedClass;

      // a) Attendance calculation
      let totalSchoolDays = 0;
      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;
      let excusedDays = 0;
      const attendanceHistory = [];

      attendanceDocs.forEach(attDoc => {
        if (attDoc.className === sClass || !attDoc.className) {
          const rec = attDoc.records || {};
          const notes = attDoc.notes || {};
          const status = rec[sId] || (sNid ? rec[sNid] : null);
          const note = notes[sId] || (sNid ? notes[sNid] : '');

          if (status) {
            totalSchoolDays++;
            if (status === 'present') presentDays++;
            else if (status === 'absent') absentDays++;
            else if (status === 'late') lateDays++;
            else if (status === 'excused') excusedDays++;

            attendanceHistory.push({
              date: attDoc.date,
              status: status,
              note: note,
              teacherId: attDoc.teacherId,
              docId: attDoc.id
            });
          }
        }
      });

      attendanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      const attendanceRate = totalSchoolDays > 0 
        ? Math.round(((presentDays + (lateDays * 0.7) + (excusedDays * 0.9)) / totalSchoolDays) * 100) 
        : 100;

      // b) Electronic Assignments Calculation
      const classAssignments = assignments.filter(a => (a.targetClass === sClass || a.className === sClass));
      const myAssignmentSubmissions = assignmentResults.filter(ar => ar.studentId === sId || ar.studentId === sNid);
      
      let assignmentTotalScore = 0;
      let assignmentMaxPossible = 0;
      myAssignmentSubmissions.forEach(sub => {
        assignmentTotalScore += (Number(sub.score) || 0);
        assignmentMaxPossible += (Number(sub.totalQuestions) || (Number(sub.score) > 0 ? Number(sub.score) : 1));
      });
      const assignmentAveragePct = assignmentMaxPossible > 0 
        ? Math.round((assignmentTotalScore / assignmentMaxPossible) * 100)
        : (myAssignmentSubmissions.length > 0 ? 100 : 0);

      // c) Electronic Exams Calculation
      const classElectronicExams = exams.filter(e => (!e.isExternal) && (e.targetClass === sClass || e.className === sClass));
      const myExamResults = examResults.filter(er => er.studentId === sId || er.studentId === sNid);
      
      const myElectronicExamResults = myExamResults.filter(er => {
        const matchingExam = exams.find(e => e.id === er.examId);
        return matchingExam && !matchingExam.isExternal;
      });

      let electronicExamTotalScore = 0;
      let electronicExamMaxPossible = 0;
      myElectronicExamResults.forEach(er => {
        electronicExamTotalScore += (Number(er.score) || 0);
        electronicExamMaxPossible += (Number(er.totalQuestions) || (Number(er.maxScore) || 20));
      });
      const electronicExamAveragePct = electronicExamMaxPossible > 0
        ? Math.round((electronicExamTotalScore / electronicExamMaxPossible) * 100)
        : (myElectronicExamResults.length > 0 ? 100 : 0);

      // d) Period 1 (الفترة الأولى)
      const period1Result = myExamResults.find(er => {
        const ex = exams.find(e => e.id === er.examId);
        const title = (ex?.title || '').toLowerCase();
        return title.includes('الفترة الأولى') || title.includes('فترة 1') || title.includes('period 1');
      });
      const period1Score = period1Result ? Number(period1Result.score) : null;
      const period1Max = period1Result ? (Number(period1Result.totalQuestions) || Number(period1Result.maxScore) || 20) : 20;
      const period1Pct = period1Score !== null ? Math.round((period1Score / period1Max) * 100) : null;

      // e) Period 2 (الفترة الثانية)
      const period2Result = myExamResults.find(er => {
        const ex = exams.find(e => e.id === er.examId);
        const title = (ex?.title || '').toLowerCase();
        return title.includes('الفترة الثانية') || title.includes('فترة 2') || title.includes('period 2');
      });
      const period2Score = period2Result ? Number(period2Result.score) : null;
      const period2Max = period2Result ? (Number(period2Result.totalQuestions) || Number(period2Result.maxScore) || 20) : 20;
      const period2Pct = period2Score !== null ? Math.round((period2Score / period2Max) * 100) : null;

      // f) Midterm Exam (اختبار منتصف الفصل)
      const midtermResult = myExamResults.find(er => {
        const ex = exams.find(e => e.id === er.examId);
        const title = (ex?.title || '').toLowerCase();
        return title.includes('منتصف') || title.includes('نصف') || title.includes('midterm');
      });
      const midtermScore = midtermResult ? Number(midtermResult.score) : null;
      const midtermMax = midtermResult ? (Number(midtermResult.totalQuestions) || Number(midtermResult.maxScore) || 20) : 20;
      const midtermPct = midtermScore !== null ? Math.round((midtermScore / midtermMax) * 100) : null;

      // g) Final Exam (الاختبار النهائي)
      const finalResult = myExamResults.find(er => {
        const ex = exams.find(e => e.id === er.examId);
        const title = (ex?.title || '').toLowerCase();
        return title.includes('نهائي') || title.includes('نهاية') || title.includes('final');
      });
      const finalScore = finalResult ? Number(finalResult.score) : null;
      const finalMax = finalResult ? (Number(finalResult.totalQuestions) || Number(finalResult.maxScore) || 40) : 40;
      const finalPct = finalScore !== null ? Math.round((finalScore / finalMax) * 100) : null;

      // h) Participation & Classroom Engagement (مشاركة الطلاب)
      const customEval = customEvaluations[sId] || (sNid ? customEvaluations[sNid] : null);
      const activityData = studentActivityMap[sId] || { totalPoints: 0, stars: 1 };
      
      // Default participation score derived from gamification activity + submissions + attendance, or custom evaluation
      const calculatedParticipation = Math.min(20, Math.max(10, Math.round(10 + (activityData.totalPoints / 20) + (attendanceRate > 90 ? 5 : 2))));
      const participationScore = customEval?.participationScore !== undefined ? Number(customEval.participationScore) : calculatedParticipation;

      // i) Overall Comprehensive Weighted GPA / Grade Calculation
      let availableComponents = [];
      if (attendanceRate !== null) availableComponents.push({ pct: attendanceRate, weight: 10 });
      if (assignmentAveragePct > 0 || myAssignmentSubmissions.length > 0) availableComponents.push({ pct: assignmentAveragePct, weight: 15 });
      if (electronicExamAveragePct > 0 || myElectronicExamResults.length > 0) availableComponents.push({ pct: electronicExamAveragePct, weight: 15 });
      if (period1Pct !== null) availableComponents.push({ pct: period1Pct, weight: 15 });
      if (period2Pct !== null) availableComponents.push({ pct: period2Pct, weight: 15 });
      if (midtermPct !== null) availableComponents.push({ pct: midtermPct, weight: 15 });
      if (finalPct !== null) availableComponents.push({ pct: finalPct, weight: 15 });
      if (participationScore !== null) availableComponents.push({ pct: (participationScore / 20) * 100, weight: 10 });

      let overallPct = 100;
      if (availableComponents.length > 0) {
        const totalWeight = availableComponents.reduce((acc, c) => acc + c.weight, 0);
        const weightedSum = availableComponents.reduce((acc, c) => acc + (c.pct * c.weight), 0);
        overallPct = Math.round(weightedSum / totalWeight);
      }

      // Grade classification
      let gradeLabel = 'ممتاز مرتفع';
      let gradeColor = '#059669'; // Emerald
      let gradeBg = '#ecfdf5';

      if (overallPct >= 95) {
        gradeLabel = 'ممتاز مرتفع (A+)';
        gradeColor = '#059669';
        gradeBg = '#ecfdf5';
      } else if (overallPct >= 90) {
        gradeLabel = 'ممتاز (A)';
        gradeColor = '#10b981';
        gradeBg = '#ecfdf5';
      } else if (overallPct >= 80) {
        gradeLabel = 'جيد جداً (B)';
        gradeColor = '#0284c7';
        gradeBg = '#f0f9ff';
      } else if (overallPct >= 70) {
        gradeLabel = 'جيد (C)';
        gradeColor = '#d97706';
        gradeBg = '#fffbeb';
      } else if (overallPct >= 60) {
        gradeLabel = 'مقبول (D)';
        gradeColor = '#e11d48';
        gradeBg = '#fff1f2';
      } else {
        gradeLabel = 'يحتاج متابعة وتدخل (F)';
        gradeColor = '#dc2626';
        gradeBg = '#fef2f2';
      }

      return {
        ...student,
        class: sClass,
        attendance: {
          totalDays: totalSchoolDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          rate: attendanceRate,
          history: attendanceHistory
        },
        assignments: {
          totalAssigned: classAssignments.length,
          totalSubmitted: myAssignmentSubmissions.length,
          averagePct: assignmentAveragePct,
          submissions: myAssignmentSubmissions
        },
        electronicExams: {
          totalExams: classElectronicExams.length,
          totalTaken: myElectronicExamResults.length,
          averagePct: electronicExamAveragePct,
          results: myElectronicExamResults
        },
        period1: {
          score: period1Score,
          maxScore: period1Max,
          pct: period1Pct,
          result: period1Result
        },
        period2: {
          score: period2Score,
          maxScore: period2Max,
          pct: period2Pct,
          result: period2Result
        },
        midterm: {
          score: midtermScore,
          maxScore: midtermMax,
          pct: midtermPct,
          result: midtermResult
        },
        finalExam: {
          score: finalScore,
          maxScore: finalMax,
          pct: finalPct,
          result: finalResult
        },
        participation: {
          score: participationScore,
          maxScore: 20,
          points: activityData.totalPoints,
          stars: activityData.stars,
          notes: customEval?.notes || ''
        },
        overall: {
          percentage: overallPct,
          label: gradeLabel,
          color: gradeColor,
          bg: gradeBg,
          needsSupport: overallPct < 70 || absentDays >= 3
        }
      };
    });
  }, [students, selectedClass, effectiveRole, userData, attendanceDocs, assignments, assignmentResults, exams, examResults, customEvaluations, studentActivityMap]);

  // 6. Filtered Student Records for Table Display
  const filteredRecords = useMemo(() => {
    return processedStudentRecords.filter(rec => {
      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (rec.name || '').toLowerCase().includes(q);
        const matchNid = String(rec.nationalId || '').toLowerCase().includes(q);
        if (!matchName && !matchNid) return false;
      }

      // Status Filter
      if (statusFilter === 'EXCELLENT' && rec.overall.percentage < 90) return false;
      if (statusFilter === 'VERY_GOOD' && (rec.overall.percentage < 80 || rec.overall.percentage >= 90)) return false;
      if (statusFilter === 'GOOD' && (rec.overall.percentage < 70 || rec.overall.percentage >= 80)) return false;
      if (statusFilter === 'NEEDS_SUPPORT' && rec.overall.percentage >= 70 && rec.attendance.absentDays < 3) return false;
      if (statusFilter === 'HIGH_ABSENCE' && rec.attendance.absentDays < 2) return false;

      return true;
    });
  }, [processedStudentRecords, searchQuery, statusFilter]);

  // 7. Auto-Select Student for Parent Dossier View
  useEffect(() => {
    if (effectiveRole === 'parent' && processedStudentRecords.length > 0 && !selectedStudentForDossier) {
      setSelectedStudentForDossier(processedStudentRecords[0]);
    }
  }, [effectiveRole, processedStudentRecords, selectedStudentForDossier]);

  // 8. Class Aggregate KPI Statistics
  const classKPIs = useMemo(() => {
    if (processedStudentRecords.length === 0) {
      return { totalStudents: 0, classAvgPct: 0, attendanceRate: 100, topCount: 0, supportCount: 0 };
    }
    const total = processedStudentRecords.length;
    const avgPct = Math.round(processedStudentRecords.reduce((acc, r) => acc + r.overall.percentage, 0) / total);
    const avgAtt = Math.round(processedStudentRecords.reduce((acc, r) => acc + r.attendance.rate, 0) / total);
    const topCount = processedStudentRecords.filter(r => r.overall.percentage >= 90).length;
    const supportCount = processedStudentRecords.filter(r => r.overall.needsSupport).length;

    return {
      totalStudents: total,
      classAvgPct: avgPct,
      attendanceRate: avgAtt,
      topCount,
      supportCount
    };
  }, [processedStudentRecords]);

  // 9. Handle Saving Attendance from inside the Record
  const handleSaveAttendanceEdit = async (e) => {
    e.preventDefault();
    if (!editingAttendanceStudent || !attendanceEditDate) return;
    setIsSavingAttendance(true);
    setAttendanceEditSuccess('');

    try {
      const sId = editingAttendanceStudent.id;
      const sClass = editingAttendanceStudent.class || selectedClass;
      const targetSchoolId = schoolId || 'default_school_1';
      const docId = `${targetSchoolId}_${sClass.replace(/\//g, '-')}_${attendanceEditDate}`;
      const docRef = doc(db, 'attendance', docId);

      await setDoc(docRef, {
        schoolId: targetSchoolId,
        className: sClass,
        date: attendanceEditDate,
        teacherId: teacherDocId || auth.currentUser?.uid || 'admin',
        teacherEmail: auth.currentUser?.email || '',
        records: {
          [sId]: attendanceEditStatus
        },
        notes: {
          [sId]: attendanceEditNote
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setAttendanceEditSuccess('تم تحديث حالة الحضور والغياب بنجاح في قاعدة البيانات!');
      setTimeout(() => {
        setAttendanceEditSuccess('');
        setEditingAttendanceStudent(null);
      }, 1200);
    } catch (err) {
      console.error('Error modifying attendance:', err);
      alert('حدث خطأ أثناء حفظ حالة الغياب');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // 10. Handle Saving Custom Participation / Evaluation
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!editingEvaluationStudent) return;
    setIsSavingEvaluation(true);

    try {
      const sId = editingEvaluationStudent.id;
      const targetSchoolId = schoolId || 'default_school_1';
      const docRef = doc(db, 'student_evaluations', `${targetSchoolId}_${sId}`);

      await setDoc(docRef, {
        studentId: sId,
        studentName: editingEvaluationStudent.name,
        nationalId: editingEvaluationStudent.nationalId || '',
        class: editingEvaluationStudent.class || selectedClass,
        schoolId: targetSchoolId,
        participationScore: Number(manualParticipationScore),
        notes: manualEvaluationNotes,
        updatedBy: userData?.name || 'المعلم',
        updatedByRole: effectiveRole,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      alert('تم حفظ تقييم وملاحظات المشاركة بنجاح!');
      setEditingEvaluationStudent(null);
    } catch (err) {
      console.error('Error saving evaluation:', err);
      alert('حدث خطأ أثناء حفظ التقييم');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  // 11. Handle Exporting Class Record to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'م', 'اسم الطالب', 'رقم الهوية', 'الفصل', 'نسبة الحضور %', 'أيام الغياب', 'تأخر', 'بعذر',
      'الواجبات %', 'الاختبارات الإلكترونية %', 'الفترة الأولى', 'الفترة الثانية', 'المشاركة (من 20)',
      'منتصف الفصل', 'النهائي', 'المجموع الشامل %', 'التقدير العام'
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      `"${r.name || ''}"`,
      `"${r.nationalId || ''}"`,
      `"${r.class || selectedClass}"`,
      `${r.attendance.rate}%`,
      r.attendance.absentDays,
      r.attendance.lateDays,
      r.attendance.excusedDays,
      `${r.assignments.averagePct}%`,
      `${r.electronicExams.averagePct}%`,
      r.period1.score !== null ? `${r.period1.score}/${r.period1.maxScore}` : '—',
      r.period2.score !== null ? `${r.period2.score}/${r.period2.maxScore}` : '—',
      r.participation.score,
      r.midterm.score !== null ? `${r.midterm.score}/${r.midterm.maxScore}` : '—',
      r.finalExam.score !== null ? `${r.finalExam.score}/${r.finalExam.maxScore}` : '—',
      `${r.overall.percentage}%`,
      `"${r.overall.label}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجل_متابعة_${selectedClass || 'الطلاب'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Hero Banner */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0e7490 100%)',
        borderRadius: '20px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(14, 116, 144, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow ambient light */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.6rem' }}>📑</span>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                سجل متابعة الطالب الشامل
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#7dd3fc',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                ربط آلي مع كافة الأنشطة والنتائج
              </span>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.92rem', color: '#e0f2fe' }}>
              سحب فوري ومباشر لبيانات الغياب والحضور، الواجبات والاختبارات الإلكترونية، نتائج الفترات (1 و 2)، المشاركة الصفية، اختبار منتصف الفصل، والنتائج النهائية.
            </p>
          </div>

          {/* Action Buttons for Export & Print */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportCSV}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Download size={16} /> تصدير Excel (CSV)
            </button>
            <button
              onClick={handlePrint}
              className="btn"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Printer size={16} /> طباعة الكشف الشامل
            </button>
          </div>
        </div>

        {/* Teacher Assigned Class Restriction Banner */}
        {effectiveRole === 'teacher' && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <span>
              نطاق الصلاحيات: <strong>معلم مصرح</strong> • يتم عرض الفصول المسندة لك فقط في الجدول الدراسي ({assignedClasses.length > 0 ? assignedClasses.join('، ') : 'جاري التحقق من الفصول'}).
            </span>
          </div>
        )}
      </div>

      {/* Navigation View Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {effectiveRole !== 'parent' && (
          <button
            onClick={() => setActiveView('matrix')}
            style={{
              background: activeView === 'matrix' ? 'var(--color-primary-dark, #0e7490)' : '#ffffff',
              color: activeView === 'matrix' ? '#ffffff' : '#475569',
              border: '1px solid #cbd5e1',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeView === 'matrix' ? '0 4px 12px rgba(14, 116, 144, 0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} /> كشف متابعة الفصل الشامل (Matrix View)
          </button>
        )}

        <button
          onClick={() => {
            setActiveView('student_dossier');
            if (!selectedStudentForDossier && processedStudentRecords.length > 0) {
              setSelectedStudentForDossier(processedStudentRecords[0]);
            }
          }}
          style={{
            background: activeView === 'student_dossier' ? 'var(--color-primary-dark, #0e7490)' : '#ffffff',
            color: activeView === 'student_dossier' ? '#ffffff' : '#475569',
            border: '1px solid #cbd5e1',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: activeView === 'student_dossier' ? '0 4px 12px rgba(14, 116, 144, 0.25)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={18} /> {effectiveRole === 'parent' ? 'سجل متابعة ابني / ابنتي' : 'الملف الفردي وبطاقة المتابعة (Student Dossier)'}
        </button>

        {effectiveRole !== 'parent' && (
          <button
            onClick={() => setActiveView('analytics')}
            style={{
              background: activeView === 'analytics' ? 'var(--color-primary-dark, #0e7490)' : '#ffffff',
              color: activeView === 'analytics' ? '#ffffff' : '#475569',
              border: '1px solid #cbd5e1',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeView === 'analytics' ? '0 4px 12px rgba(14, 116, 144, 0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <BarChart2 size={18} /> التقارير التحليلية والمؤشرات (Analytics & Insights)
          </button>
        )}
      </div>

      {/* Controls & Filter Bar */}
      <div className="glass-panel no-print" style={{ padding: '18px 24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Class Selector */}
          {effectiveRole !== 'parent' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '260px' }}>
              <label style={{ fontWeight: 700, color: '#334155', fontSize: '14px', whiteSpace: 'nowrap' }}>
                اختيار الفصل:
              </label>
              <select
                className="input-field"
                style={{ width: '100%', marginBottom: 0, padding: '8px 12px', fontWeight: 600 }}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {assignedClasses.length === 0 && <option value="">لا توجد فصول متاحة</option>}
                {assignedClasses.map(cName => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={17} color="#94a3b8" style={{ position: 'absolute', top: '10px', right: isRTL ? '12px' : 'auto', left: isRTL ? 'auto' : '12px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="البحث بالاسم أو رقم الهوية الوطنية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                marginBottom: 0,
                paddingRight: isRTL ? '36px' : '12px',
                paddingLeft: isRTL ? '12px' : '36px',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Status Filter Pills */}
          {activeView === 'matrix' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStatusFilter('ALL')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  background: statusFilter === 'ALL' ? '#0f172a' : '#f8fafc',
                  color: statusFilter === 'ALL' ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                الكل ({processedStudentRecords.length})
              </button>
              <button
                onClick={() => setStatusFilter('EXCELLENT')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #a7f3d0',
                  background: statusFilter === 'EXCELLENT' ? '#059669' : '#ecfdf5',
                  color: statusFilter === 'EXCELLENT' ? '#ffffff' : '#047857',
                  cursor: 'pointer'
                }}
              >
                🌟 المتفوقين ({classKPIs.topCount})
              </button>
              <button
                onClick={() => setStatusFilter('NEEDS_SUPPORT')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #fecaca',
                  background: statusFilter === 'NEEDS_SUPPORT' ? '#dc2626' : '#fef2f2',
                  color: statusFilter === 'NEEDS_SUPPORT' ? '#ffffff' : '#b91c1c',
                  cursor: 'pointer'
                }}
              >
                ⚠️ يحتاجون متابعة ({classKPIs.supportCount})
              </button>
              <button
                onClick={() => setStatusFilter('HIGH_ABSENCE')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid #fed7aa',
                  background: statusFilter === 'HIGH_ABSENCE' ? '#ea580c' : '#fff7ed',
                  color: statusFilter === 'HIGH_ABSENCE' ? '#ffffff' : '#c2410c',
                  cursor: 'pointer'
                }}
              >
                🚨 تكرار الغياب
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Hidden in Print) */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>إجمالي طلاب الفصل</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{classKPIs.totalStudents} طالب</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>نسبة الحضور العامة</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{classKPIs.attendanceRate}%</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>متوسط تحصيل الفصل</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#9333ea' }}>{classKPIs.classAvgPct}%</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>الطلاب المتفوقين</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{classKPIs.topCount} طالب</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>يحتاجون متابعة</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{classKPIs.supportCount} طالب</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: CLASS COMPREHENSIVE MATRIX TABLE (كشف متابعة الفصل الشامل) */}
      {/* ========================================================================= */}
      {activeView === 'matrix' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', color: 'var(--color-primary-dark, #0e7490)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <BookOpen size={20} /> كشف رصد ومتابعة درجات الفصل: <strong>{selectedClass || 'جميع الفصول'}</strong>
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                البيانات مسحوبة تلقائياً مع إمكانية تعديل حالة الغياب والمشاركة الفردية
              </p>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <Users size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>لا توجد بيانات طلاب مطابقة للفصل أو البحث المحدد</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155', fontWeight: 700 }}>
                  <tr>
                    <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '12px 14px', minWidth: '180px' }}>اسم الطالب</th>
                    <th style={{ padding: '12px 14px', minWidth: '130px', textAlign: 'center', background: '#f1f5f9' }}>الغياب والحضور</th>
                    <th style={{ padding: '12px 14px', minWidth: '110px', textAlign: 'center' }}>الواجبات الإلكترونية</th>
                    <th style={{ padding: '12px 14px', minWidth: '110px', textAlign: 'center' }}>الاختبارات الإلكترونية</th>
                    <th style={{ padding: '12px 14px', minWidth: '95px', textAlign: 'center' }}>الفترة 1</th>
                    <th style={{ padding: '12px 14px', minWidth: '95px', textAlign: 'center' }}>الفترة 2</th>
                    <th style={{ padding: '12px 14px', minWidth: '100px', textAlign: 'center' }}>المشاركة</th>
                    <th style={{ padding: '12px 14px', minWidth: '95px', textAlign: 'center' }}>منتصف الفصل</th>
                    <th style={{ padding: '12px 14px', minWidth: '95px', textAlign: 'center' }}>النهائي</th>
                    <th style={{ padding: '12px 14px', minWidth: '110px', textAlign: 'center', background: '#f0fdf4' }}>المجموع التراكمي</th>
                    <th style={{ padding: '12px 14px', minWidth: '120px', textAlign: 'center' }}>التقدير العام</th>
                    <th style={{ padding: '12px 14px', minWidth: '120px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr 
                        key={record.id || idx} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          background: isEven ? '#ffffff' : '#fafafa',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* 1. Index */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* 2. Student Info */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>هوية: {record.nationalId || '—'}</div>
                            </div>
                            <GamificationBadge
                              points={record.participation.points}
                              stars={record.participation.stars}
                              size="xs"
                            />
                          </div>
                        </td>

                        {/* 3. Attendance Status & Quick Edit */}
                        <td style={{ padding: '10px 14px', textAlign: 'center', background: isEven ? '#f8fafc' : '#f1f5f9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: record.attendance.rate >= 90 ? '#dcfce7' : (record.attendance.rate >= 75 ? '#fef3c7' : '#fee2e2'),
                                color: record.attendance.rate >= 90 ? '#15803d' : (record.attendance.rate >= 75 ? '#b45309' : '#b91c1c')
                              }}>
                                {record.attendance.rate}% حضور
                              </span>
                              {record.attendance.absentDays > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>
                                  ({record.attendance.absentDays} غ)
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingAttendanceStudent(record);
                                setAttendanceEditDate(new Date().toISOString().split('T')[0]);
                                setAttendanceEditStatus('present');
                                setAttendanceEditNote('');
                              }}
                              className="btn"
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                padding: '2px 8px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                color: '#0e7490',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer'
                              }}
                              title="تعديل حالة الحضور والغياب للطالب"
                            >
                              <Edit size={12} /> تعديل الغياب
                            </button>
                          </div>
                        </td>

                        {/* 4. Electronic Assignments */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.assignments.averagePct}%</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {record.assignments.totalSubmitted} من {record.assignments.totalAssigned || record.assignments.totalSubmitted}
                          </div>
                        </td>

                        {/* 5. Electronic Exams */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.electronicExams.averagePct}%</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {record.electronicExams.totalTaken} اختبار
                          </div>
                        </td>

                        {/* 6. Period 1 */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {record.period1.score !== null ? (
                            <span style={{ fontWeight: 700, color: record.period1.pct >= 60 ? '#166534' : '#991b1b' }}>
                              {record.period1.score} <span style={{ fontSize: '11px', color: '#64748b' }}>/ {record.period1.maxScore}</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 7. Period 2 */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {record.period2.score !== null ? (
                            <span style={{ fontWeight: 700, color: record.period2.pct >= 60 ? '#166534' : '#991b1b' }}>
                              {record.period2.score} <span style={{ fontSize: '11px', color: '#64748b' }}>/ {record.period2.maxScore}</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 8. Participation & Classroom Activities */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#b45309' }}>
                              {record.participation.score}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>/ 20</span>
                            <button
                              onClick={() => {
                                setEditingEvaluationStudent(record);
                                setManualParticipationScore(record.participation.score);
                                setManualEvaluationNotes(record.participation.notes || '');
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                              title="تعديل درجات وملاحظات المشاركة"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        </td>

                        {/* 9. Midterm Exam */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {record.midterm.score !== null ? (
                            <span style={{ fontWeight: 700, color: record.midterm.pct >= 60 ? '#166534' : '#991b1b' }}>
                              {record.midterm.score} <span style={{ fontSize: '11px', color: '#64748b' }}>/ {record.midterm.maxScore}</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 10. Final Exam */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {record.finalExam.score !== null ? (
                            <span style={{ fontWeight: 700, color: record.finalExam.pct >= 60 ? '#166534' : '#991b1b' }}>
                              {record.finalExam.score} <span style={{ fontSize: '11px', color: '#64748b' }}>/ {record.finalExam.maxScore}</span>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        {/* 11. Cumulative Percentage */}
                        <td style={{ padding: '12px 14px', textAlign: 'center', background: isEven ? '#f0fdf4' : '#ecfdf5' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: record.overall.color }}>
                            {record.overall.percentage}%
                          </span>
                        </td>

                        {/* 12. Overall Grade */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: record.overall.bg,
                            color: record.overall.color,
                            border: `1px solid ${record.overall.color}30`,
                            display: 'inline-block'
                          }}>
                            {record.overall.label}
                          </span>
                        </td>

                        {/* 13. Actions */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedStudentForDossier(record);
                              setActiveView('student_dossier');
                            }}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '8px'
                            }}
                          >
                            <Eye size={13} /> الملف الشامل
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: INDIVIDUAL STUDENT DOSSIER & REPORT (الملف الفردي الشامل للطالب) */}
      {/* ========================================================================= */}
      {activeView === 'student_dossier' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Student Selector Dropdown for Teacher/Admin */}
          {effectiveRole !== 'parent' && (
            <div className="glass-panel no-print" style={{ padding: '16px 20px', borderRadius: '14px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 700, color: '#334155', fontSize: '14px' }}>عرض ملف الطالب:</span>
                <select
                  className="input-field"
                  style={{ width: '260px', marginBottom: 0, fontWeight: 700 }}
                  value={selectedStudentForDossier?.id || ''}
                  onChange={(e) => {
                    const match = processedStudentRecords.find(s => s.id === e.target.value);
                    if (match) setSelectedStudentForDossier(match);
                  }}
                >
                  {processedStudentRecords.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class || selectedClass})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const idx = processedStudentRecords.findIndex(s => s.id === selectedStudentForDossier?.id);
                    if (idx > 0) setSelectedStudentForDossier(processedStudentRecords[idx - 1]);
                  }}
                  className="btn btn-outline"
                  disabled={!selectedStudentForDossier || processedStudentRecords.findIndex(s => s.id === selectedStudentForDossier?.id) <= 0}
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ChevronRight size={16} /> السابق
                </button>
                <button
                  onClick={() => {
                    const idx = processedStudentRecords.findIndex(s => s.id === selectedStudentForDossier?.id);
                    if (idx >= 0 && idx < processedStudentRecords.length - 1) setSelectedStudentForDossier(processedStudentRecords[idx + 1]);
                  }}
                  className="btn btn-outline"
                  disabled={!selectedStudentForDossier || processedStudentRecords.findIndex(s => s.id === selectedStudentForDossier?.id) >= processedStudentRecords.length - 1}
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  التالي <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {!selectedStudentForDossier ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              يرجى اختيار طالب لعرض ملف المتابعة الشامل الخاص به
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Student Header Profile Card */}
              <div className="glass-panel" style={{
                padding: '24px 28px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0e7490 0%, #0284c7 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 800,
                    boxShadow: '0 8px 16px rgba(14, 116, 144, 0.25)'
                  }}>
                    {selectedStudentForDossier.name ? selectedStudentForDossier.name.charAt(0) : 'ط'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudentForDossier.name}
                      </h2>
                      <GamificationBadge
                        points={selectedStudentForDossier.participation.points}
                        stars={selectedStudentForDossier.participation.stars}
                        size="sm"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
                      <span><strong>الصف الدراسي:</strong> {selectedStudentForDossier.class || selectedClass}</span>
                      <span>•</span>
                      <span><strong>رقم الهوية:</strong> {selectedStudentForDossier.nationalId || 'غير محدد'}</span>
                      <span>•</span>
                      <span><strong>الجنسية:</strong> {selectedStudentForDossier.nationality || 'سعودي'}</span>
                    </div>
                  </div>
                </div>

                {/* Overall Score Badge */}
                <div style={{
                  background: selectedStudentForDossier.overall.bg,
                  border: `2px solid ${selectedStudentForDossier.overall.color}`,
                  padding: '12px 24px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  minWidth: '160px'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>التحصيل التراكمي الشامل</div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: selectedStudentForDossier.overall.color }}>
                    {selectedStudentForDossier.overall.percentage}%
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: selectedStudentForDossier.overall.color }}>
                    {selectedStudentForDossier.overall.label}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
                
                {/* Card 1: الحضور والغياب */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} color="#0284c7" /> الحضور والغياب والانضباط
                    </h3>
                    <button
                      onClick={() => {
                        setEditingAttendanceStudent(selectedStudentForDossier);
                        setAttendanceEditDate(new Date().toISOString().split('T')[0]);
                        setAttendanceEditStatus('present');
                        setAttendanceEditNote('');
                      }}
                      className="btn btn-outline"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={12} /> تعديل الغياب
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>نسبة الحضور</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: selectedStudentForDossier.attendance.rate >= 90 ? '#059669' : '#dc2626' }}>
                        {selectedStudentForDossier.attendance.rate}%
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>أيام الغياب</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: selectedStudentForDossier.attendance.absentDays > 0 ? '#dc2626' : '#059669' }}>
                        {selectedStudentForDossier.attendance.absentDays} أيام
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>أيام الحضور الفعلي:</strong> {selectedStudentForDossier.attendance.presentDays} يوم</div>
                    <div><strong>أيام التأخر:</strong> {selectedStudentForDossier.attendance.lateDays} يوم</div>
                    <div><strong>غياب بعذر مقبول:</strong> {selectedStudentForDossier.attendance.excusedDays} يوم</div>
                  </div>

                  {/* Recent Attendance Logs */}
                  {selectedStudentForDossier.attendance.history.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>آخر السجلات المسجلة:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {selectedStudentForDossier.attendance.history.slice(0, 5).map((log, lIdx) => (
                          <div key={lIdx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                            <span>{log.date}</span>
                            <span style={{
                              fontWeight: 700,
                              color: log.status === 'present' ? '#166534' : (log.status === 'absent' ? '#dc2626' : '#d97706')
                            }}>
                              {log.status === 'present' ? 'حاضر' : (log.status === 'absent' ? 'غائب' : (log.status === 'late' ? 'متأخر' : 'بعذر'))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 2: الواجبات والتكليفات الإلكترونية */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#16a34a" /> الواجبات والتكليفات الإلكترونية
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>نسبة إنجاز الواجبات</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                        {selectedStudentForDossier.assignments.averagePct}%
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>الواجبات المسلمة</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudentForDossier.assignments.totalSubmitted} من {selectedStudentForDossier.assignments.totalAssigned || selectedStudentForDossier.assignments.totalSubmitted}
                      </div>
                    </div>
                  </div>

                  {selectedStudentForDossier.assignments.submissions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                      لم يقم الطالب بتسليم أي واجبات إلكترونية بعد
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {selectedStudentForDossier.assignments.submissions.map((sub, subIdx) => (
                        <div key={subIdx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600 }}>واجب {subIdx + 1}</span>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>
                            {sub.score} / {sub.totalQuestions} ({Math.round((sub.score / sub.totalQuestions) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card 3: الاختبارات الإلكترونية والقصيرة */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="#9333ea" /> الاختبارات الإلكترونية والقصيرة
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#faf5ff', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>متوسط الاختبارات</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#9333ea' }}>
                        {selectedStudentForDossier.electronicExams.averagePct}%
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>الاختبارات المنفذة</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudentForDossier.electronicExams.totalTaken} اختبار
                      </div>
                    </div>
                  </div>

                  {selectedStudentForDossier.electronicExams.results.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                      لا توجد اختبارات إلكترونية مسجلة بعد
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                      {selectedStudentForDossier.electronicExams.results.map((res, rIdx) => (
                        <div key={rIdx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontWeight: 600 }}>اختبار {rIdx + 1}</span>
                          <span style={{ fontWeight: 700, color: '#9333ea' }}>
                            {res.score} / {res.totalQuestions || 20} ({Math.round((res.score / (res.totalQuestions || 20)) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card 4: نتائج الفترات ومنتصف الفصل والنهائي */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={18} color="#d97706" /> نتائج الفترات والاختبارات المعتمدة
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>الفترة الأولى</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
                        {selectedStudentForDossier.period1.score !== null ? `${selectedStudentForDossier.period1.score} / ${selectedStudentForDossier.period1.maxScore}` : 'غير مرصود'}
                      </div>
                    </div>

                    <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>الفترة الثانية</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
                        {selectedStudentForDossier.period2.score !== null ? `${selectedStudentForDossier.period2.score} / ${selectedStudentForDossier.period2.maxScore}` : 'غير مرصود'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>منتصف الفصل</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudentForDossier.midterm.score !== null ? `${selectedStudentForDossier.midterm.score} / ${selectedStudentForDossier.midterm.maxScore}` : 'غير مرصود'}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>الاختبار النهائي</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudentForDossier.finalExam.score !== null ? `${selectedStudentForDossier.finalExam.score} / ${selectedStudentForDossier.finalExam.maxScore}` : 'غير مرصود'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 5: المشاركة الصفية ونقاط التفاعل */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#eab308" /> المشاركة والتفاعل الصفي
                    </h3>
                    <button
                      onClick={() => {
                        setEditingEvaluationStudent(selectedStudentForDossier);
                        setManualParticipationScore(selectedStudentForDossier.participation.score);
                        setManualEvaluationNotes(selectedStudentForDossier.participation.notes || '');
                      }}
                      className="btn btn-outline"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={12} /> تقييم المشاركة
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>درجة المشاركة المرصودة:</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309' }}>
                        {selectedStudentForDossier.participation.score} / 20
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>نقاط التفاعل والنشاط:</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                        +{selectedStudentForDossier.participation.points} نقطة
                      </div>
                    </div>
                  </div>

                  {selectedStudentForDossier.participation.notes ? (
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#475569', border: '1px solid #e2e8f0' }}>
                      <strong>ملاحظات المعلم:</strong> {selectedStudentForDossier.participation.notes}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>لا توجد ملاحظات سلوكية مخصصة مسجلة حالياً</div>
                  )}
                </div>

                {/* Card 6: التوصيات الأكاديمية والتوجيهات */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <ShieldCheck size={18} color="#059669" /> التقييم الشامل والتوجيه التربوي
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                      <strong>نقاط القوة:</strong> {selectedStudentForDossier.attendance.rate >= 90 ? 'انضباط والتزام ممتاز في الحضور الصفي.' : 'مشاركة وتفاعل إيجابي في المهام الصفية.'}
                    </div>

                    {selectedStudentForDossier.overall.needsSupport ? (
                      <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                        <strong>توجيه الدعم:</strong> يوصى بتكثيف المتابعة الأكاديمية وحل الواجبات التفاعلية لرفع معدل التحصيل.
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                        <strong>الاستمرار في التميز:</strong> أداء أكاديمي وسلوكي متميز يستحق التعزيز والتشجيع المستمر.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: ANALYTICS & INSIGHTS (التقارير التحليلية والمتابعة الشاملة) */}
      {/* ========================================================================= */}
      {activeView === 'analytics' && effectiveRole !== 'parent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--color-primary-dark, #0e7490)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={22} /> التقارير التحليلية وتوزيع مستويات الطلاب لفصل: {selectedClass || 'الفصل المختار'}
            </h2>

            {/* Distribution Graph Representation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>ممتاز (90% - 100%)</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>
                    {processedStudentRecords.filter(r => r.overall.percentage >= 90).length}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
                  {processedStudentRecords.length > 0 ? Math.round((processedStudentRecords.filter(r => r.overall.percentage >= 90).length / processedStudentRecords.length) * 100) : 0}% من إجمالي الفصل
                </div>
              </div>

              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>جيد جداً (80% - 89%)</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7' }}>
                    {processedStudentRecords.filter(r => r.overall.percentage >= 80 && r.overall.percentage < 90).length}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
                  {processedStudentRecords.length > 0 ? Math.round((processedStudentRecords.filter(r => r.overall.percentage >= 80 && r.overall.percentage < 90).length / processedStudentRecords.length) * 100) : 0}% من إجمالي الفصل
                </div>
              </div>

              <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>جيد (70% - 79%)</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#d97706' }}>
                    {processedStudentRecords.filter(r => r.overall.percentage >= 70 && r.overall.percentage < 80).length}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>
                  {processedStudentRecords.length > 0 ? Math.round((processedStudentRecords.filter(r => r.overall.percentage >= 70 && r.overall.percentage < 80).length / processedStudentRecords.length) * 100) : 0}% من إجمالي الفصل
                </div>
              </div>

              <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>يحتاج متابعة (&lt;70%)</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626' }}>
                    {processedStudentRecords.filter(r => r.overall.percentage < 70).length}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>
                  {processedStudentRecords.length > 0 ? Math.round((processedStudentRecords.filter(r => r.overall.percentage < 70).length / processedStudentRecords.length) * 100) : 0}% من إجمالي الفصل
                </div>
              </div>
            </div>

            {/* List of Top Achievers vs Support Needed */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Top Achievers */}
              <div style={{ border: '1px solid #a7f3d0', borderRadius: '12px', padding: '18px', background: '#f0fdf4' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={18} color="#059669" /> لوحة الشرف وأوائل الفصل (Top Achievers)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {processedStudentRecords.filter(r => r.overall.percentage >= 90).slice(0, 8).map((st, sIdx) => (
                    <div key={st.id || sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{sIdx + 1}. {st.name}</span>
                      <span style={{ fontWeight: 800, color: '#059669' }}>{st.overall.percentage}%</span>
                    </div>
                  ))}
                  {processedStudentRecords.filter(r => r.overall.percentage >= 90).length === 0 && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, textAlign: 'center' }}>لا يوجد طلاب بمعدل 90% فما فوق حالياً</p>
                  )}
                </div>
              </div>

              {/* Students Requiring Intervention */}
              <div style={{ border: '1px solid #fecaca', borderRadius: '12px', padding: '18px', background: '#fff5f5' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#dc2626" /> خطة التدخل العلاجي والمتابعة (Academic Support)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {processedStudentRecords.filter(r => r.overall.needsSupport).slice(0, 8).map((st, sIdx) => (
                    <div key={st.id || sIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                        <div style={{ fontSize: '11px', color: '#dc2626' }}>
                          {st.attendance.absentDays >= 3 ? `غياب ${st.attendance.absentDays} أيام` : 'معدل منخفض'}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#dc2626' }}>{st.overall.percentage}%</span>
                    </div>
                  ))}
                  {processedStudentRecords.filter(r => r.overall.needsSupport).length === 0 && (
                    <p style={{ fontSize: '13px', color: '#059669', margin: 0, textAlign: 'center' }}>كافة طلاب الفصل مستقرون ولا توجد حالات تعثر</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL ATTENDANCE EDITOR (تعديل الغياب من داخل السجل) */}
      {/* ========================================================================= */}
      {editingAttendanceStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#ffffff', width: '480px', maxWidth: '100%', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setEditingAttendanceStudent(null)} 
              style={{ position: 'absolute', top: '16px', left: isRTL ? '16px' : 'auto', right: isRTL ? 'auto' : '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark, #0e7490)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
              <Edit size={18} /> تعديل حالة الغياب والحضور
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              الطالب: <strong>{editingAttendanceStudent.name}</strong> • الفصل: <strong>{editingAttendanceStudent.class || selectedClass}</strong>
            </p>

            {attendanceEditSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600 }}>
                {attendanceEditSuccess}
              </div>
            )}

            <form onSubmit={handleSaveAttendanceEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  تاريخ اليوم / الحصة:
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={attendanceEditDate}
                  onChange={(e) => setAttendanceEditDate(e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 0 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  الحالة الجديدة للطالب:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px',
                    border: attendanceEditStatus === 'present' ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: attendanceEditStatus === 'present' ? '#ecfdf5' : '#f8fafc',
                    cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#065f46'
                  }}>
                    <input
                      type="radio"
                      name="attStatus"
                      value="present"
                      checked={attendanceEditStatus === 'present'}
                      onChange={() => setAttendanceEditStatus('present')}
                    />
                    حاضر (Present)
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px',
                    border: attendanceEditStatus === 'absent' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                    background: attendanceEditStatus === 'absent' ? '#fef2f2' : '#f8fafc',
                    cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#991b1b'
                  }}>
                    <input
                      type="radio"
                      name="attStatus"
                      value="absent"
                      checked={attendanceEditStatus === 'absent'}
                      onChange={() => setAttendanceEditStatus('absent')}
                    />
                    غائب (Absent)
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px',
                    border: attendanceEditStatus === 'late' ? '2px solid #d97706' : '1px solid #e2e8f0',
                    background: attendanceEditStatus === 'late' ? '#fffbeb' : '#f8fafc',
                    cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#92400e'
                  }}>
                    <input
                      type="radio"
                      name="attStatus"
                      value="late"
                      checked={attendanceEditStatus === 'late'}
                      onChange={() => setAttendanceEditStatus('late')}
                    />
                    متأخر (Late)
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px',
                    border: attendanceEditStatus === 'excused' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: attendanceEditStatus === 'excused' ? '#f0f9ff' : '#f8fafc',
                    cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#0369a1'
                  }}>
                    <input
                      type="radio"
                      name="attStatus"
                      value="excused"
                      checked={attendanceEditStatus === 'excused'}
                      onChange={() => setAttendanceEditStatus('excused')}
                    />
                    بعذر (Excused)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  سبب الغياب / ملاحظات المعلم (اختياري):
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="مثال: عذر طبي، ظرف عائلي، إلخ..."
                  value={attendanceEditNote}
                  onChange={(e) => setAttendanceEditNote(e.target.value)}
                  style={{ width: '100%', marginBottom: 0 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingAttendance}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} /> {isSavingAttendance ? 'جاري الحفظ...' : 'حفظ التعديل في السجل'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAttendanceStudent(null)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL PARTICIPATION & EVALUATION EDITOR */}
      {/* ========================================================================= */}
      {editingEvaluationStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#ffffff', width: '450px', maxWidth: '100%', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setEditingEvaluationStudent(null)} 
              style={{ position: 'absolute', top: '16px', left: isRTL ? '16px' : 'auto', right: isRTL ? 'auto' : '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            <h3 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark, #0e7490)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
              <Star size={18} color="#eab308" /> رصد درجة وملاحظات المشاركة الصفية
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              الطالب: <strong>{editingEvaluationStudent.name}</strong>
            </p>

            <form onSubmit={handleSaveEvaluation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  درجة المشاركة والتفاعل الصفي (من 20):
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="input-field"
                  value={manualParticipationScore}
                  onChange={(e) => setManualParticipationScore(e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 0, fontWeight: 700, fontSize: '16px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  ملاحظات وتوجيهات المعلم السلوكية:
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="اكتب توجيهاتك للطالب أو ولي الأمر حول المشاركة الصفية والواجبات..."
                  value={manualEvaluationNotes}
                  onChange={(e) => setManualEvaluationNotes(e.target.value)}
                  style={{ width: '100%', marginBottom: 0, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingEvaluation}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Save size={16} /> {isSavingEvaluation ? 'جاري الحفظ...' : 'حفظ التقييم والملاحظات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEvaluationStudent(null)}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
