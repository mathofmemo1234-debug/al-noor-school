import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Award, UserCheck, Calendar, Eye, Trash2, Plus, Search, Filter, AlertCircle, Printer, X } from 'lucide-react';
import EvaluatorView from '../components/evaluation/EvaluatorView';
import TeacherEvaluationView from '../components/evaluation/TeacherEvaluationView';
import VisitorEvaluationView from '../components/evaluation/VisitorEvaluationView';
import { createClassroomVisit, deleteVisitAndRenumber, getSampleEvaluationForVisit } from '../services/evaluationService';

export default function TeacherPerformanceEvaluationHub({ role = 'admin' }) {
  const { userData, currentUser } = useAuth();
  const [visits, setVisits] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');

  // Add Visit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [newVisitForm, setNewVisitForm] = useState({
    subject: '',
    classRoom: '',
    stage: 'المرحلة الثانوية',
    nationality: 'سعودي',
    period: 'الحصة الثالثة',
    visitDate: new Date().toISOString().split('T')[0],
    lessonTitle: ''
  });

  const schoolId = userData?.schoolId || currentUser?.schoolId || '';
  const currentUserId = currentUser?.uid || '';
  const isEvaluator = role === 'admin' || role === 'supervisor' || role === 'staff';
  const isTeacher = role === 'teacher';
  const isVisitor = role === 'visitor';

  // 1. Fetch Teachers for Dropdown & Mapping (With or without schoolId filter)
  useEffect(() => {
    const q = schoolId 
      ? query(collection(db, 'teachers'), where('schoolId', '==', schoolId))
      : collection(db, 'teachers');

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(list);
      if (list.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(list[0].id || list[0].nationalId);
        setNewVisitForm(prev => ({
          ...prev,
          subject: list[0].subject || '',
          classRoom: list[0].assignedClass || 'الصف الأول',
          nationality: list[0].nationality || 'سعودي'
        }));
      }
    });
    return () => unsub();
  }, [schoolId]);

  // 2. Fetch Evaluations
  useEffect(() => {
    const q = schoolId 
      ? query(collection(db, 'evaluations'), where('schoolId', '==', schoolId))
      : collection(db, 'evaluations');

    const unsub = onSnapshot(q, (snap) => {
      setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [schoolId]);

  // 3. Fetch Live Visits from Firestore & Auto-initialize if empty
  useEffect(() => {
    const q = schoolId 
      ? query(collection(db, 'classroom_visits'), where('schoolId', '==', schoolId))
      : collection(db, 'classroom_visits');

    const unsub = onSnapshot(q, async (snap) => {
      const dbVisits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // If DB has visits, sort and use them
      if (dbVisits.length > 0) {
        dbVisits.sort((a, b) => (a.seqNumber || 0) - (b.seqNumber || 0));
        setVisits(dbVisits);
      } else if (teachers.length > 0) {
        // Auto-seed visits for all teachers so visits appear IMMEDIATELY for every teacher
        const initialVisits = teachers.map((t, idx) => {
          const seq = idx + 1;
          return {
            id: `temp_${t.id || idx}`,
            schoolId: schoolId || 'school_001',
            seqNumber: seq,
            visitNumber: `VIS-${seq}`,
            teacherId: t.id || t.nationalId,
            teacherName: t.name || 'معلم',
            specialty: t.subject || 'عام',
            subject: t.subject || 'عام',
            classRoom: t.assignedClass || 'الصف الأول',
            stage: 'المرحلة الثانوية',
            nationality: t.nationality || 'سعودي',
            period: 'الحصة الثالثة',
            visitDate: new Date().toISOString().split('T')[0],
            lessonTitle: 'درس تطبيقي',
            evaluatorId: currentUserId,
            evaluatorName: userData?.name || 'المشرف التربوي'
          };
        });
        setVisits(initialVisits);

        // Also save to Firestore in background so it persists
        try {
          for (const v of initialVisits) {
            const { id, ...vPayload } = v;
            createClassroomVisit(vPayload, schoolId || 'school_001').catch(e => console.log(e));
          }
        } catch (e) {
          console.log('Auto-seed background:', e);
        }
      } else {
        setVisits([]);
      }
    });
    return () => unsub();
  }, [schoolId, teachers.length]);

  // Handle Teacher Selection in Modal
  const handleTeacherDropdownChange = (tId) => {
    setSelectedTeacherId(tId);
    const foundTeacher = teachers.find(t => t.id === tId || t.nationalId === tId);
    if (foundTeacher) {
      setNewVisitForm(prev => ({
        ...prev,
        subject: foundTeacher.subject || prev.subject,
        classRoom: foundTeacher.assignedClass || prev.classRoom,
        nationality: foundTeacher.nationality || prev.nationality
      }));
    }
  };

  // Submit New Visit
  const handleCreateVisit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      alert('يرجى اختيار المعلم من القائمة المنسدلة.');
      return;
    }
    const foundTeacher = teachers.find(t => t.id === selectedTeacherId || t.nationalId === selectedTeacherId);

    try {
      setIsSavingVisit(true);
      const newV = await createClassroomVisit({
        teacherId: selectedTeacherId,
        teacherName: foundTeacher?.name || 'معلم',
        specialty: foundTeacher?.subject || newVisitForm.subject,
        subject: newVisitForm.subject,
        classRoom: newVisitForm.classRoom,
        stage: newVisitForm.stage,
        nationality: newVisitForm.nationality,
        period: newVisitForm.period,
        visitDate: newVisitForm.visitDate,
        lessonTitle: newVisitForm.lessonTitle,
        evaluatorId: currentUserId,
        evaluatorName: userData?.name || 'المشرف التربوي'
      }, schoolId || 'school_001');

      setShowAddModal(false);
      alert('تم إنشاء الزيارة الصفية بنجاح وترقيمها تلقائياً.');
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء الزيارة: ' + err.message);
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Delete Visit with DOUBLE WARNING & Automatic Sequential Renumbering
  const handleDeleteVisit = async (visitItem) => {
    const vNum = visitItem.visitNumber || `VIS-${visitItem.seqNumber}`;
    
    // Warning 1
    const firstConfirm = window.confirm(`تحذير (1/2): هل أنت متأكد من رغبتك في حذف الزيارة (${vNum}) للمعلم "${visitItem.teacherName}"؟`);
    if (!firstConfirm) return;

    // Warning 2
    const secondConfirm = window.confirm(`تأكيد نهائي (2/2): سيتم حذف سجل الزيارة نهائياً وإعادة ترقيم جميع الزيارات المتبقية تسلسلياً (VIS-1, VIS-2...). هل تود الاستمرار بالتأكيد؟`);
    if (!secondConfirm) return;

    try {
      await deleteVisitAndRenumber(visitItem.id, schoolId || 'school_001');
      alert(`تم حذف الزيارة (${vNum}) وإعادة الترقيم التسلسلي لجميع الزيارات بنجاح.`);
      if (selectedVisit?.id === visitItem.id) {
        setSelectedVisit(null);
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Attach matched evaluation to visits (with official sample evaluation fallback so teachers always see a complete 1448H rubric)
  const enrichedVisits = visits.map(v => {
    let matchedEval = evaluations.find(e => 
      (e.visitId && (e.visitId === v.id || e.visitId === v.visitNumber)) || 
      (e.teacherId && (e.teacherId === v.teacherId || e.teacherId === v.nationalId)) ||
      (e.headerData?.teacherName && v.teacherName && e.headerData.teacherName.trim() === v.teacherName.trim())
    );
    if (!matchedEval) {
      matchedEval = getSampleEvaluationForVisit(v);
    }
    return {
      ...v,
      evaluation: matchedEval
    };
  });

  // Filtered Visits
  const filteredVisits = enrichedVisits.filter(v => {
    // Role filter: ensure logged-in teacher matches their own visits
    if (isTeacher) {
      const myName = (userData?.name || currentUser?.displayName || '').trim();
      const myNid = String(userData?.nationalId || '').trim();
      const myUid = String(currentUser?.uid || '').trim();

      const isMyVisit = (
        (v.teacherId && (v.teacherId === myUid || v.teacherId === myNid)) ||
        (v.teacherName && myName && v.teacherName.trim() === myName) ||
        (v.teacherName && myName && (v.teacherName.includes(myName) || myName.includes(v.teacherName))) ||
        (v.nationalId && myNid && String(v.nationalId) === myNid)
      );
      if (!isMyVisit) return false;
    }

    // Teacher dropdown filter
    if (teacherFilter !== 'all' && v.teacherId !== teacherFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const evStatus = v.evaluation?.status || 'none';
      if (statusFilter !== evStatus) return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = v.teacherName?.toLowerCase().includes(q);
      const matchSubject = v.subject?.toLowerCase().includes(q);
      const matchNum = (v.visitNumber || '').toLowerCase().includes(q);
      return matchName || matchSubject || matchNum;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'right' }} dir="rtl">
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.6rem' }}>📋</span>
              <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>
                نظام تقييم الأداء والملاحظة الصفية لعام 1448هـ
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              شركة المدارس المتقدمة • استمارة الملاحظة الصفية، المداولة الإشرافية، والترقيم التسلسلي التلقائي
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {isEvaluator && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> إضافة زيارة صفية جديدة
              </button>
            )}
            <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', background: isEvaluator ? '#eff6ff' : isTeacher ? '#f0fdf4' : '#faf5ff', color: isEvaluator ? '#1d4ed8' : isTeacher ? '#15803d' : '#7e22ce', border: '1px solid currentColor' }}>
              {isEvaluator ? '👨‍💼 شاشة المقيّم (إدارة / إشراف)' : isTeacher ? '👨‍🏫 شاشة المعلم (المُقيَّم)' : '👤 شاشة الزائر المعني'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Area: Detailed View or List View */}
      {selectedVisit ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedVisit(null)}
              className="btn"
              style={{ background: 'white', border: '1px solid var(--color-border)', fontWeight: 'bold', padding: '8px 18px', borderRadius: '10px' }}
            >
              ⬅ العودة لسجل الزيارات الصفية
            </button>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              زيارة: {selectedVisit.visitNumber || selectedVisit.id} • {selectedVisit.teacherName}
            </div>
          </div>

          {isEvaluator && (
            <EvaluatorView
              visit={selectedVisit}
              initialEvaluation={selectedVisit.evaluation}
              currentUser={currentUser}
              onSaved={() => setSelectedVisit(null)}
            />
          )}

          {isTeacher && (
            (selectedVisit.evaluation || getSampleEvaluationForVisit(selectedVisit)) ? (
              <TeacherEvaluationView
                evaluation={selectedVisit.evaluation || getSampleEvaluationForVisit(selectedVisit)}
                currentUser={currentUser}
                onDecisionMade={() => setSelectedVisit(null)}
              />
            ) : (
              <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', color: '#92400e' }}>
                  <AlertCircle size={32} style={{ color: '#d97706', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800 }}>الزيارة الصفية مجدولة وفي انتظار رصد المشرف التربوي</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>
                      تم تسجيل بيانات الزيارة الصفية (رقم {selectedVisit.visitNumber || selectedVisit.id}) بنجاح. ستظهر هنا استمارة الملاحظة الصفية ونتائج التقييم والمداولة الإشرافية فور اعتمادها من قبل المشرف التربوي.
                    </p>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div><strong>المعلم:</strong> {selectedVisit.teacherName}</div>
                  <div><strong>المادة والتخصص:</strong> {selectedVisit.subject} ({selectedVisit.specialty || selectedVisit.subject})</div>
                  <div><strong>المرحلة والصف:</strong> {selectedVisit.stage} - {selectedVisit.classRoom}</div>
                  <div><strong>تاريخ الزيارة والحصة:</strong> {selectedVisit.visitDate} ({selectedVisit.period})</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>عنوان الدرس المزار:</strong> {selectedVisit.lessonTitle || 'درس تطبيقي'}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleEval = getSampleEvaluationForVisit(selectedVisit);
                      setSelectedVisit({ ...selectedVisit, evaluation: sampleEval });
                    }}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold', padding: '10px 24px', borderRadius: '10px' }}
                  >
                    📋 استعراض نموذج الملاحظة الصفية الاسترشادي لعام 1448هـ
                  </button>
                </div>
              </div>
            )
          )}

          {isVisitor && (
            <VisitorEvaluationView
              rawEvaluation={selectedVisit.evaluation}
              visitId={selectedVisit.visitNumber || selectedVisit.id}
            />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter & Dropdown Bar */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', background: 'var(--color-bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="البحث باسم المعلم، التخصص، أو رقم الزيارة (VIS-1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
              />
            </div>

            {/* Teacher Dropdown Filter */}
            {isEvaluator && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>المعلم:</span>
                <select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', background: 'white', fontWeight: 600 }}
                >
                  <option value="all">جميع المعلمين</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id || t.nationalId}>
                      {t.name} ({t.subject || 'عام'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="#64748b" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', background: 'white' }}
              >
                <option value="all">جميع حالات التقييم</option>
                <option value="draft">مسودة (Draft)</option>
                <option value="sent">مُرسل للمعلم (Sent)</option>
                <option value="approved">معتمد من المعلم (Approved)</option>
                <option value="rejected">مرفوض من المعلم (Rejected)</option>
                <option value="none">غير مقيم بعد</option>
              </select>
            </div>
          </div>

          {/* Visits Table */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                سجل الزيارات والملاحظة الصفية ({filteredVisits.length})
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                الترقيم متسلسل تلقائياً ويُعاد ضبطه عند حذف أي زيارة
              </span>
            </div>

            {filteredVisits.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                لا توجد زيارات صفية مضافة حالياً.
                {isEvaluator && (
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ fontSize: '12px' }}>
                      + إضافة أول زيارة صفية
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'center', width: '90px' }}>رقم الزيارة</th>
                      <th style={{ padding: '12px 10px' }}>اسم المعلم</th>
                      <th style={{ padding: '12px 10px' }}>المادة والصف</th>
                      <th style={{ padding: '12px 10px' }}>تاريخ الزيارة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>الدرجة والنسبة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>التقدير العام</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>حالة التقييم</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>مؤشر القراءة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', width: '140px' }}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {filteredVisits.map((v) => {
                      const ev = v.evaluation;
                      const vNum = v.visitNumber || `VIS-${v.seqNumber || 1}`;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 900, color: '#0284c7' }}>
                            {vNum}
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                            {v.teacherName}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#64748b' }}>
                            {v.subject} {v.classRoom ? `(${v.classRoom})` : ''}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#64748b' }}>
                            {v.visitDate}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                            {ev ? (
                              <span style={{ color: ev.percentage >= 90 ? '#16a34a' : ev.percentage >= 80 ? '#0284c7' : '#d97706' }}>
                                {ev.percentage}% ({ev.totalEarnedScore}/{ev.totalMaxScore})
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {ev ? (
                              <span style={{ fontWeight: 'bold', fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: ev.percentage >= 90 ? '#dcfce7' : ev.percentage >= 80 ? '#e0f2fe' : ev.percentage >= 70 ? '#fef3c7' : '#fee2e2', color: ev.percentage >= 90 ? '#16a34a' : ev.percentage >= 80 ? '#0284c7' : ev.percentage >= 70 ? '#d97706' : '#dc2626' }}>
                                {ev.rating || 'مكتمل'}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {!ev && <span style={{ color: '#94a3b8', fontSize: '12px' }}>غير مقيم</span>}
                            {ev?.status === 'draft' && <span style={{ color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>مسودة</span>}
                            {ev?.status === 'sent' && <span style={{ color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>مُرسل</span>}
                            {ev?.status === 'approved' && <span style={{ color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>معتمد</span>}
                            {ev?.status === 'rejected' && <span style={{ color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>مرفوض</span>}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {ev?.readAt ? (
                              <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Eye size={13} /> تم الاطلاع
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                                {ev ? 'لم يقرأ' : '—'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                onClick={() => setSelectedVisit(v)}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                              >
                                {isEvaluator ? (ev ? 'تعديل الاستمارة' : 'تقييم الزيارة') : 'عرض الاستمارة'}
                              </button>

                              {isEvaluator && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVisit(v)}
                                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer' }}
                                  title="حذف الزيارة وإعادة الترقيم (تحذير مرتين)"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add New Visit with Teacher Dropdown */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 900, fontSize: '17px' }}>
                <Plus size={20} color="#0284c7" /> إضافة زيارة صفية جديدة
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* رقم الزيارة التلقائي */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold' }}>رقم الزيارة التسلسلي (تلقائي):</span>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7' }}>
                  VIS-{visits.length + 1}
                </span>
              </div>

              {/* قائمة المعلمين المنسدلة (Dropdown) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  اختر المعلم من القائمة المنسدلة: *
                </label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherDropdownChange(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', background: 'white' }}
                >
                  <option value="">-- اضغط لاختيار اسم المعلم --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id || t.nationalId}>
                      {t.name} — ({t.subject || 'عام'} • {t.assignedClass || 'الصف الأول'})
                    </option>
                  ))}
                </select>
              </div>

              {/* المادة والصف */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                    المادة / التخصص:
                  </label>
                  <input
                    type="text"
                    required
                    value={newVisitForm.subject}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                    الصف والشعبة:
                  </label>
                  <input
                    type="text"
                    value={newVisitForm.classRoom}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, classRoom: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* التاريخ والحصة */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                    تاريخ الزيارة:
                  </label>
                  <input
                    type="date"
                    required
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                    الحصة:
                  </label>
                  <select
                    value={newVisitForm.period}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, period: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="الحصة الأولى">الحصة الأولى</option>
                    <option value="الحصة الثانية">الحصة الثانية</option>
                    <option value="الحصة الثالثة">الحصة الثالثة</option>
                    <option value="الحصة الرابعة">الحصة الرابعة</option>
                    <option value="الحصة الخامسة">الحصة الخامسة</option>
                    <option value="الحصة السادسة">الحصة السادسة</option>
                    <option value="الحصة السابعة">الحصة السابعة</option>
                  </select>
                </div>
              </div>

              {/* عنوان موضوع الدرس */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                  عنوان موضوع الدرس المزار:
                </label>
                <input
                  type="text"
                  placeholder="مثال: مقدمة في الدوال المثلثية وتطبيقاتها..."
                  value={newVisitForm.lessonTitle}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, lessonTitle: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600, padding: '8px 18px', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold', padding: '8px 20px', borderRadius: '8px' }}
                >
                  {isSavingVisit ? 'جاري الإنشاء...' : 'حفظ وإنشاء الزيارة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
