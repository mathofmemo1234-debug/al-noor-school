import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  Award, UserCheck, Calendar, Eye, Trash2, Plus, Search, Filter, 
  AlertCircle, Printer, X, Lock, Unlock, Send, CheckCircle2, XCircle, 
  Clock, Bell, ShieldCheck, ShieldAlert, FileText, Check, AlertTriangle
} from 'lucide-react';
import EvaluatorView from '../components/evaluation/EvaluatorView';
import TeacherEvaluationView from '../components/evaluation/TeacherEvaluationView';
import VisitorEvaluationView from '../components/evaluation/VisitorEvaluationView';
import { 
  createClassroomVisit, 
  deleteVisitAndRenumber, 
  getSampleEvaluationForVisit,
  requestVisitAccess,
  respondToVisitAccessRequest
} from '../services/evaluationService';

export default function TeacherPerformanceEvaluationHub({ role = 'admin' }) {
  const { userData, currentUser } = useAuth();
  const [visits, setVisits] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [visitTypeTab, setVisitTypeTab] = useState('all'); // 'all' | 'principal' | 'supervisor' | 'requests'

  // Add Visit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [newVisitForm, setNewVisitForm] = useState({
    visitType: role === 'supervisor' ? 'supervisor' : 'principal',
    subject: '',
    classRoom: '',
    stage: 'المرحلة الثانوية',
    nationality: 'سعودي',
    period: 'الحصة الثالثة',
    visitDate: new Date().toISOString().split('T')[0],
    lessonTitle: ''
  });

  // Request Access Modal State (Principal <-> Supervisor)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [targetVisitForRequest, setTargetVisitForRequest] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Supervisor / Principal Responding State
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  const schoolId = userData?.schoolId || currentUser?.schoolId || '';
  const currentUserId = currentUser?.uid || userData?.id || 'user_default';
  const isAdmin = role === 'admin' || userData?.role === 'admin' || userData?.role === 'superadmin';
  const isSupervisor = role === 'supervisor' || userData?.role === 'supervisor';
  const isEvaluator = isAdmin || isSupervisor || role === 'staff';
  const isTeacher = role === 'teacher';
  const isVisitor = role === 'visitor';

  // 1. Fetch Teachers for Dropdown & Mapping
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'teachers'), (snap) => {
      const allTeachers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let list = allTeachers;
      if (schoolId && schoolId !== 'ALL') {
        const filtered = allTeachers.filter(t => !t.schoolId || t.schoolId === schoolId || t.schoolId === 'school_001' || t.schoolId === 'default_school_1');
        if (filtered.length > 0) list = filtered;
      }
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

  // 2. Fetch Evaluations Live from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'evaluations'), (snap) => {
      const allEvals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvaluations(allEvals);
    });
    return () => unsub();
  }, []);

  // 3. Fetch Live Visits from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classroom_visits'), async (snap) => {
      let dbVisits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (schoolId && schoolId !== 'ALL') {
        const filtered = dbVisits.filter(v => !v.schoolId || v.schoolId === schoolId || v.schoolId === 'school_001' || v.schoolId === 'default_school_1');
        if (filtered.length > 0) dbVisits = filtered;
      }
      
      if (dbVisits.length > 0) {
        dbVisits.sort((a, b) => (a.seqNumber || 0) - (b.seqNumber || 0));
        setVisits(dbVisits);
      } else {
        setVisits([]);
      }
    });
    return () => unsub();
  }, [schoolId]);

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

    const determinedVisitType = newVisitForm.visitType || (isSupervisor ? 'supervisor' : 'principal');
    const determinedRole = determinedVisitType === 'supervisor' ? 'supervisor' : 'admin';
    const evaluatorTitle = determinedVisitType === 'supervisor' ? 'المشرف التربوي' : 'مدير المدرسة';

    try {
      setIsSavingVisit(true);
      await createClassroomVisit({
        visitType: determinedVisitType,
        evaluatorRole: determinedRole,
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
        evaluatorName: userData?.name || evaluatorTitle,
        accessRequests: [],
        approvedViewers: []
      }, schoolId || 'school_001');

      setShowAddModal(false);
      alert('✓ تم إنشاء الزيارة الصفية بنجاح.');
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء الزيارة: ' + err.message);
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Delete Visit with Double Warning
  const handleDeleteVisit = async (visitItem) => {
    const vNum = visitItem.visitNumber || `VIS-${visitItem.seqNumber}`;
    
    // Warning 1
    const firstConfirm = window.confirm(`تحذير (1/2): هل أنت متأكد من رغبتك في حذف الزيارة (${vNum}) للمعلم "${visitItem.teacherName}"؟`);
    if (!firstConfirm) return;

    // Warning 2
    const secondConfirm = window.confirm(`تأكيد نهائي (2/2): سيتم حذف سجل الزيارة نهائياً وإعادة ترقيم جميع الزيارات المتبقية تسلسلياً. هل تود الاستمرار؟`);
    if (!secondConfirm) return;

    try {
      await deleteVisitAndRenumber(visitItem.id, schoolId || 'school_001');
      alert(`✓ تم حذف الزيارة (${vNum}) بنجاح.`);
      if (selectedVisit?.id === visitItem.id) {
        setSelectedVisit(null);
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Attach matched evaluation to visits
  const enrichedVisits = useMemo(() => {
    return visits.map(v => {
      let matchedEval = evaluations.find(e => 
        (e.id && (e.id === `eval_${v.id}` || e.id === `eval_${v.visitNumber}` || e.id === v.id || e.id === v.visitNumber)) ||
        (e.visitId && (e.visitId === v.id || e.visitId === v.visitNumber || String(e.visitId) === String(v.seqNumber))) || 
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
  }, [visits, evaluations]);

  // Compute Pending Access Requests (Relevant to the Logged-in User's Role)
  const pendingRequestsList = useMemo(() => {
    const list = [];
    visits.forEach(v => {
      const isSupVisit = v.visitType === 'supervisor' || v.evaluatorRole === 'supervisor';
      const isPrincVisit = !isSupVisit;

      // If logged-in as Supervisor, look at requests on Supervisor visits (from Principal)
      // If logged-in as Admin/Principal, look at requests on Principal visits (from Supervisor)
      const isRelevantToMe = isSupervisor ? isSupVisit : (isAdmin ? isPrincVisit : true);

      if (isRelevantToMe && Array.isArray(v.accessRequests)) {
        v.accessRequests.forEach(req => {
          if (req.status === 'pending') {
            list.push({ ...req, visit: v });
          }
        });
      }
    });
    return list;
  }, [visits, isSupervisor, isAdmin]);

  // Check if current user has view permission for a visit (Mutual Isolation)
  const checkCanViewVisit = (v) => {
    // 1. Teacher can view all their own visits
    if (isTeacher) return true;

    // 2. Visitor can view
    if (isVisitor) return true;

    const isSupVisit = v.visitType === 'supervisor' || v.evaluatorRole === 'supervisor';
    const isPrincVisit = !isSupVisit;

    // 3. Supervisor viewing
    if (isSupervisor) {
      // Supervisor visits -> fully accessible
      if (isSupVisit) return true;
      // Principal visits -> LOCKED by default unless approved by Principal
      const approved = Array.isArray(v.approvedViewers) && (
        v.approvedViewers.includes(currentUserId) ||
        v.approvedViewers.includes(userData?.id) ||
        v.approvedViewers.includes(userData?.uid)
      );
      return approved;
    }

    // 4. Principal / Admin viewing
    if (isAdmin) {
      // Principal visits -> fully accessible
      if (isPrincVisit) return true;
      // Supervisor visits -> LOCKED by default unless approved by Supervisor
      const approved = Array.isArray(v.approvedViewers) && (
        v.approvedViewers.includes(currentUserId) ||
        v.approvedViewers.includes(userData?.id) ||
        v.approvedViewers.includes(userData?.uid)
      );
      return approved;
    }

    return true;
  };

  // Get Access Request Status for current user
  const getUserRequestStatus = (v) => {
    if (!Array.isArray(v.accessRequests) || v.accessRequests.length === 0) return 'none';
    const req = v.accessRequests.find(r => 
      r.requesterId === currentUserId || 
      r.requesterId === userData?.id || 
      r.requesterId === userData?.uid
    );
    return req ? req.status : 'none';
  };

  // Send Access Request Handler (Mutual: Principal <-> Supervisor)
  const handleOpenRequestModal = (v) => {
    setTargetVisitForRequest(v);
    setRequestNote('');
    setShowRequestModal(true);
  };

  const handleSendAccessRequest = async (e) => {
    e.preventDefault();
    if (!targetVisitForRequest) return;

    setIsSubmittingRequest(true);
    const myRole = isSupervisor ? 'supervisor' : 'admin';
    const myName = userData?.name || (isSupervisor ? 'المشرف التربوي' : 'مدير المدرسة');
    const isTargetSupervisorVisit = targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor';

    try {
      await requestVisitAccess(targetVisitForRequest.id, {
        id: currentUserId,
        uid: currentUserId,
        name: myName,
        role: myRole
      }, requestNote);

      setShowRequestModal(false);
      const recipientTitle = isTargetSupervisorVisit ? 'المشرف التربوي' : 'مدير المدرسة';
      alert(`✓ تم إرسال طلب مشاهدة تقرير الزيارة إلى ${recipientTitle} بنجاح. سيتم إشعارك فور اعتماده.`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Supervisor / Principal Decision on Access Request Handler
  const handleRespondToRequest = async (visitId, requestId, decision) => {
    setIsProcessingResponse(true);
    const responderName = userData?.name || (isSupervisor ? 'المشرف التربوي' : 'مدير المدرسة');

    try {
      await respondToVisitAccessRequest(visitId, requestId, decision, {
        id: currentUserId,
        name: responderName
      });
      alert(decision === 'approved' 
        ? '✓ تمت الموافقة وإتاحة تقرير الزيارة للطرف الطالب بنجاح.' 
        : '✓ تم تسجيل رفض طلب المشاهدة بنجاح.'
      );
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء معالجة الطلب: ' + err.message);
    } finally {
      setIsProcessingResponse(false);
    }
  };

  // Filtered Visits based on Tabs & Search
  const filteredVisits = useMemo(() => {
    return enrichedVisits.filter(v => {
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

      // Visit Type Tab Filter (Principal vs Supervisor)
      if (visitTypeTab === 'principal') {
        if (v.visitType !== 'principal' && v.evaluatorRole !== 'admin') return false;
      } else if (visitTypeTab === 'supervisor') {
        if (v.visitType !== 'supervisor' && v.evaluatorRole !== 'supervisor') return false;
      }

      // Teacher dropdown filter
      if (teacherFilter !== 'all' && v.teacherId !== teacherFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        const isApproved = v.evaluation?.status === 'approved' || v.evaluation?.teacherDecision === 'approved';
        const isRejected = v.evaluation?.status === 'rejected' || v.evaluation?.teacherDecision === 'rejected';
        const isDraft = v.evaluation?.status === 'draft';
        const isSent = v.evaluation?.status === 'sent' && !isApproved && !isRejected;
        const isNone = !v.evaluation || v.evaluation?.status === 'none';

        if (statusFilter === 'approved' && !isApproved) return false;
        if (statusFilter === 'rejected' && !isRejected) return false;
        if (statusFilter === 'draft' && !isDraft) return false;
        if (statusFilter === 'sent' && !isSent) return false;
        if (statusFilter === 'none' && !isNone) return false;
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
  }, [enrichedVisits, isTeacher, visitTypeTab, teacherFilter, statusFilter, searchQuery, userData, currentUser]);

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
              شركة المدارس المتقدمة • نظام العزل المتبادل لزيارات المدير والمشرف التربوي مع ميزة طلب المشاهدة والموافقة المعتمدة
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {isEvaluator && (
              <button
                type="button"
                onClick={() => {
                  setNewVisitForm(prev => ({
                    ...prev,
                    visitType: isSupervisor ? 'supervisor' : 'principal'
                  }));
                  setShowAddModal(true);
                }}
                className="btn btn-primary"
                style={{ background: isSupervisor ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> {isSupervisor ? 'إضافة زيارة إشرافية جديدة (مشرف)' : 'إضافة زيارة صفية (مدير)'}
              </button>
            )}
            <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', background: isSupervisor ? '#faf5ff' : isAdmin ? '#eff6ff' : isTeacher ? '#f0fdf4' : '#faf5ff', color: isSupervisor ? '#7e22ce' : isAdmin ? '#1d4ed8' : isTeacher ? '#15803d' : '#7e22ce', border: '1px solid currentColor' }}>
              {isSupervisor ? '🎓 المشرف التربوي' : isAdmin ? '👔 مدير المدرسة (الإدارة)' : isTeacher ? '👨‍🏫 المعلم' : '👤 زائر'}
            </span>
          </div>
        </div>

        {/* Isolation & Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setVisitTypeTab('all')}
            style={{
              background: visitTypeTab === 'all' ? '#0f172a' : 'white',
              color: visitTypeTab === 'all' ? 'white' : '#475569',
              border: '1px solid #cbd5e1',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📋 جميع الزيارات ({enrichedVisits.length})
          </button>

          <button
            type="button"
            onClick={() => setVisitTypeTab('principal')}
            style={{
              background: visitTypeTab === 'principal' ? '#0284c7' : 'white',
              color: visitTypeTab === 'principal' ? 'white' : '#0284c7',
              border: '1px solid #0284c7',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👔 زيارات مدير المدرسة ({enrichedVisits.filter(v => v.visitType === 'principal' || v.evaluatorRole === 'admin').length})
          </button>

          <button
            type="button"
            onClick={() => setVisitTypeTab('supervisor')}
            style={{
              background: visitTypeTab === 'supervisor' ? '#7e22ce' : 'white',
              color: visitTypeTab === 'supervisor' ? 'white' : '#7e22ce',
              border: '1px solid #7e22ce',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🎓 زيارات المشرف التربوي ({enrichedVisits.filter(v => v.visitType === 'supervisor' || v.evaluatorRole === 'supervisor').length})
          </button>

          {isEvaluator && (
            <button
              type="button"
              onClick={() => setVisitTypeTab('requests')}
              style={{
                background: visitTypeTab === 'requests' ? '#f59e0b' : '#fffbeb',
                color: visitTypeTab === 'requests' ? 'white' : '#b45309',
                border: '1px solid #f59e0b',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bell size={16} /> 
              {isSupervisor 
                ? `طلبات المشاهدة من المدير (${pendingRequestsList.length})` 
                : `طلبات المشاهدة من المشرف (${pendingRequestsList.length})`}
            </button>
          )}
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
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>زيارة: {selectedVisit.visitNumber || selectedVisit.id} • {selectedVisit.teacherName}</span>
              <span style={{ 
                fontSize: '12px', 
                padding: '4px 12px', 
                borderRadius: '8px', 
                background: (selectedVisit.visitType === 'supervisor' || selectedVisit.evaluatorRole === 'supervisor') ? '#f3e8ff' : '#e0f2fe',
                color: (selectedVisit.visitType === 'supervisor' || selectedVisit.evaluatorRole === 'supervisor') ? '#7e22ce' : '#0369a1',
                border: (selectedVisit.visitType === 'supervisor' || selectedVisit.evaluatorRole === 'supervisor') ? '1px solid #d8b4fe' : '1px solid #7dd3fc',
                fontWeight: '900',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {(selectedVisit.visitType === 'supervisor' || selectedVisit.evaluatorRole === 'supervisor') ? '🎓 زيارة مشرف تربوي' : '👔 زيارة مدير مدرسة'}
              </span>
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
            ) : null
          )}

          {isVisitor && (
            <VisitorEvaluationView
              rawEvaluation={selectedVisit.evaluation}
              visitId={selectedVisit.visitNumber || selectedVisit.id}
            />
          )}
        </div>
      ) : visitTypeTab === 'requests' && isEvaluator ? (
        
        /* 4. Dedicated Requests View for Supervisor & Principal */
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <Bell size={24} color="#f59e0b" />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                {isSupervisor 
                  ? 'طلبات مدير المدرسة لمشاهدة تقارير الزيارات الإشرافية' 
                  : 'طلبات المشرف التربوي لمشاهدة تقارير زيارات مدير المدرسة'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                بموجب سياسة العزل المتبادل، يتم حجب الزيارات ولا يمكن الاطلاع على التقرير والدرجات إلا بعد موافقة الطرف المنفّذ للزيارة.
              </p>
            </div>
          </div>

          {pendingRequestsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 10px auto' }} />
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>لا توجد طلبات مشاهدة معلقة حالياً</div>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>كافة تقارير الزيارات مؤمنة ومعزولة بالكامل وفق الصلاحيات المعتمدة.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingRequestsList.map((req, idx) => (
                <div key={idx} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#92400e' }}>
                        طلب وارد من: {req.requesterName} ({req.requesterRole === 'supervisor' ? 'مشرف تربوي' : 'مدير مدرسة'})
                      </span>
                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
                        {req.visit?.visitNumber || 'زيارة'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
                      <strong>المعلم المزار:</strong> {req.visit?.teacherName} ({req.visit?.subject} - {req.visit?.visitDate})
                    </div>
                    {req.notes && (
                      <div style={{ fontSize: '12px', color: '#451a03', marginTop: '6px', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: '6px' }}>
                        <strong>مبرر الطلب:</strong> "{req.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isProcessingResponse}
                      onClick={() => handleRespondToRequest(req.visit.id, req.requestId, 'rejected')}
                      style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={15} /> رفض الطلب
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingResponse}
                      onClick={() => handleRespondToRequest(req.visit.id, req.requestId, 'approved')}
                      style={{ background: '#16a34a', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)' }}
                    >
                      <CheckCircle2 size={15} /> ✅ موافقة وإتاحة المشاهدة
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                <option value="approved">معتمد من المعلم (Approved)</option>
                <option value="rejected">مرفوض من المعلم (Rejected)</option>
                <option value="sent">مُرسل وبانتظار رد المعلم (Sent)</option>
                <option value="draft">مسودة (Draft)</option>
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
                زيارات المدير والمشرف معزولة بالكامل وفق الصلاحيات ونظام طلب المشاهدة
              </span>
            </div>

            {filteredVisits.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                لا توجد زيارات صفية مطابقة للمعايير المحددة.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'center', width: '80px' }}>الرقم</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>نوع الزيارة</th>
                      <th style={{ padding: '12px 10px' }}>اسم المعلم</th>
                      <th style={{ padding: '12px 10px' }}>المادة والصف</th>
                      <th style={{ padding: '12px 10px' }}>تاريخ الزيارة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>الدرجة والنسبة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>حالة التقييم</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', width: '180px' }}>الإجراء والصلاحية</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {filteredVisits.map((v) => {
                      const ev = v.evaluation;
                      const vNum = v.visitNumber || `VIS-${v.seqNumber || 1}`;
                      const isSupervisorVisit = v.visitType === 'supervisor' || v.evaluatorRole === 'supervisor';
                      const canView = checkCanViewVisit(v);
                      const reqStatus = getUserRequestStatus(v);

                      const isApproved = ev && (ev.status === 'approved' || ev.teacherDecision === 'approved');
                      const isRejected = ev && (ev.status === 'rejected' || ev.teacherDecision === 'rejected');
                      const isDraft = ev && ev.status === 'draft';
                      const isSent = ev && ev.status === 'sent' && !isApproved && !isRejected;

                      // Check if current user is viewing the other party's visit with approved access
                      const isOtherPartyVisit = (isAdmin && isSupervisorVisit) || (isSupervisor && !isSupervisorVisit);

                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 900, color: '#0284c7' }}>
                            {vNum}
                          </td>

                          {/* Visit Type Badge */}
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {isSupervisorVisit ? (
                              <span style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                🎓 زيارة مشرف تربوي
                              </span>
                            ) : (
                              <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                👔 زيارة مدير مدرسة
                              </span>
                            )}
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

                          {/* Score and Percentage (Masked if Locked from Other Party) */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                            {!canView ? (
                              <span style={{ color: '#94a3b8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={12} /> محجوب
                              </span>
                            ) : ev ? (
                              <span style={{ color: ev.percentage >= 90 ? '#16a34a' : ev.percentage >= 80 ? '#0284c7' : '#d97706' }}>
                                {ev.percentage}% ({ev.totalEarnedScore}/{ev.totalMaxScore})
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            {!canView ? (
                              <span style={{ color: '#64748b', fontSize: '11px' }}>
                                {isSupervisorVisit ? 'خاص بالمشرف' : 'خاص بمدير المدرسة'}
                              </span>
                            ) : !ev ? (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>غير مقيم</span>
                            ) : isApproved ? (
                              <span style={{ color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                ✅ معتمد
                              </span>
                            ) : isRejected ? (
                              <span style={{ color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                ❌ مرفوض
                              </span>
                            ) : isDraft ? (
                              <span style={{ color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                📝 مسودة
                              </span>
                            ) : (
                              <span style={{ color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                📨 بانتظار الرد
                              </span>
                            )}
                          </td>

                          {/* Actions and Access Control */}
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                              
                              {canView ? (
                                <>
                                  <button
                                    onClick={() => setSelectedVisit(v)}
                                    className="btn btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                                  >
                                    {isEvaluator ? (ev ? 'عرض / تعديل' : 'تقييم الزيارة') : 'عرض الاستمارة'}
                                  </button>

                                  {/* Authorized Badge when viewing other party's visit */}
                                  {isOtherPartyVisit && (
                                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }} title="مصرح بالمشاهدة بموافقة الطرف المنفذ">
                                      <Unlock size={12} /> مصرح
                                    </span>
                                  )}
                                </>
                              ) : (
                                /* Locked from current party -> Request Flow */
                                reqStatus === 'pending' ? (
                                  <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={13} /> {isSupervisorVisit ? 'بانتظار المشرف' : 'بانتظار المدير'}
                                  </span>
                                ) : reqStatus === 'rejected' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRequestModal(v)}
                                    style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="تم رفض الطلب سابقاً، انقر لإعادة الإرسال"
                                  >
                                    <XCircle size={13} /> رُفض (إعادة طلب)
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRequestModal(v)}
                                    style={{ 
                                      background: isSupervisorVisit ? 'linear-gradient(135deg, #7e22ce, #a855f7)' : 'linear-gradient(135deg, #0284c7, #0ea5e9)', 
                                      color: 'white', 
                                      border: 'none', 
                                      padding: '6px 12px', 
                                      borderRadius: '8px', 
                                      fontSize: '11px', 
                                      fontWeight: 'bold', 
                                      cursor: 'pointer', 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)' 
                                    }}
                                  >
                                    <Send size={13} /> طلب مشاهدة الزيارة
                                  </button>
                                )
                              )}

                              {isEvaluator && !isOtherPartyVisit && (
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

      {/* MODAL 1: Add New Visit */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 900, fontSize: '17px' }}>
                <Plus size={20} color="#0284c7" /> 
                {isSupervisor ? 'إضافة زيارة صفية إشرافية (مشرف تربوي)' : 'إضافة زيارة صفية (مدير المدرسة)'}
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
              
              {/* رقم الزيارة ونوعها */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>رقم الزيارة:</span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#0284c7' }}>
                    VIS-{visits.length + 1}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>نوع الزيارة:</span>
                  <select
                    value={newVisitForm.visitType || (isSupervisor ? 'supervisor' : 'principal')}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitType: e.target.value })}
                    style={{ border: 'none', background: 'transparent', fontWeight: 900, fontSize: '12px', color: (newVisitForm.visitType === 'supervisor' || isSupervisor) ? '#7e22ce' : '#0369a1', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="principal">👔 زيارة مدير مدرسة</option>
                    <option value="supervisor">🎓 زيارة مشرف تربوي</option>
                  </select>
                </div>
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
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', fontWeight: 700 }}
                >
                  <option value="">-- اضغط لاختيار المعلم --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id || t.nationalId}>
                      {t.name} • {t.subject || 'عام'} ({t.assignedClass || 'الصف الأول'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>المادة والتخصص *</label>
                  <input
                    type="text"
                    required
                    value={newVisitForm.subject}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>الصف والفصل *</label>
                  <input
                    type="text"
                    required
                    value={newVisitForm.classRoom}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, classRoom: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>تاريخ الزيارة *</label>
                  <input
                    type="date"
                    required
                    value={newVisitForm.visitDate}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>الحصة *</label>
                  <select
                    value={newVisitForm.period}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, period: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    {['الحصة الأولى', 'الحصة الثانية', 'الحصة الثالثة', 'الحصة الرابعة', 'الحصة الخامسة', 'الحصة السادسة', 'الحصة السابعة', 'الحصة الثامنة'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>عنوان الدرس المزار</label>
                <input
                  type="text"
                  placeholder="مثال: درس تطبيقي في حل المعادلات التربيعية"
                  value={newVisitForm.lessonTitle}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, lessonTitle: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="btn btn-primary"
                  style={{ background: isSupervisor ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', fontWeight: 'bold' }}
                >
                  {isSavingVisit ? 'جارٍ الحفظ...' : 'حفظ الزيارة وتثبيتها'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Requesting Access (Principal <-> Supervisor) */}
      {showRequestModal && targetVisitForRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            maxWidth: '500px', 
            width: '100%', 
            padding: '24px', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
            borderTop: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '6px solid #7e22ce' : '6px solid #0284c7' 
          }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '#6b21a8' : '#0369a1', fontWeight: 900, fontSize: '17px' }}>
                <Send size={20} color={(targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '#7e22ce' : '#0284c7'} /> 
                {(targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') 
                  ? 'طلب مشاهدة تقرير زيارة المشرف التربوي' 
                  : 'طلب مشاهدة تقرير زيارة مدير المدرسة'}
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendAccessRequest}>
              <div style={{ 
                background: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '#faf5ff' : '#f0f9ff', 
                border: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '1px solid #e9d5ff' : '1px solid #bae6fd', 
                borderRadius: '10px', 
                padding: '12px', 
                marginBottom: '14px', 
                fontSize: '13px', 
                color: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '#581c87' : '#0369a1', 
                lineHeight: '1.6' 
              }}>
                <div><strong>رقم الزيارة:</strong> {targetVisitForRequest.visitNumber || targetVisitForRequest.id}</div>
                <div><strong>المعلم المزار:</strong> {targetVisitForRequest.teacherName} ({targetVisitForRequest.subject})</div>
                <div><strong>الجهة المنفذة للزيارة:</strong> {targetVisitForRequest.evaluatorName || ((targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? 'المشرف التربوي' : 'مدير المدرسة')}</div>
                <div><strong>تاريخ الزيارة:</strong> {targetVisitForRequest.visitDate}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                  سبب أو مبرر طلب المشاهدة (اختياري):
                </label>
                <textarea
                  rows="3"
                  className="input-field"
                  placeholder="مثال: متابعة التوصيات الفنية والإشرافية وتنفيذ الخطة التطويرية للمعلم..."
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                  style={{ width: '100%', marginBottom: 0, fontSize: '13px' }}
                />
              </div>

              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                🔒 بموجب سياسة الخصوصية، سيتم إرسال الطلب فوراً إلى الجهة المنفذة للزيارة، وسيتم فتح التقرير لك تلقائياً فور الاعتماد.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="btn btn-primary"
                  style={{ 
                    background: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? 'linear-gradient(135deg, #7e22ce, #9333ea)' : 'linear-gradient(135deg, #0284c7, #0ea5e9)', 
                    borderColor: (targetVisitForRequest.visitType === 'supervisor' || targetVisitForRequest.evaluatorRole === 'supervisor') ? '#7e22ce' : '#0284c7' 
                  }}
                >
                  {isSubmittingRequest ? 'جارٍ الإرسال...' : '📨 إرسال الطلب للاعتماد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
