import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Award, UserCheck, Calendar, Eye, CheckCircle2, XCircle, Clock, AlertTriangle, Plus, Search, Filter } from 'lucide-react';
import EvaluatorView from '../components/evaluation/EvaluatorView';
import TeacherEvaluationView from '../components/evaluation/TeacherEvaluationView';
import VisitorEvaluationView from '../components/evaluation/VisitorEvaluationView';

export default function TeacherPerformanceEvaluationHub({ role = 'admin' }) {
  const { userData, currentUser } = useAuth();
  const [visits, setVisits] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'evaluate' | 'my-evaluation'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [simulatedVisitorId, setSimulatedVisitorId] = useState('');

  const schoolId = userData?.schoolId || '';
  const currentUserId = currentUser?.uid || '';
  const isEvaluator = role === 'admin' || role === 'supervisor' || role === 'staff';
  const isTeacher = role === 'teacher';
  const isVisitor = role === 'visitor';

  // 1. Fetch Teachers
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'teachers'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      setTeachers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [schoolId]);

  // 2. Fetch Evaluations
  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, 'evaluations'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(q, (snap) => {
      setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [schoolId]);

  // 3. Build/Fetch Visits list
  useEffect(() => {
    // If teachers are available, create demo/live visits mapped with evaluations
    if (teachers.length > 0) {
      const generated = teachers.map((t, idx) => {
        const visitId = `VIS-${1000 + idx}`;
        const matchedEval = evaluations.find(e => e.teacherId === t.id || e.teacherId === t.nationalId || e.visitId === visitId);
        return {
          id: visitId,
          schoolId,
          teacherId: t.id || t.nationalId,
          teacherName: t.name || 'معلم',
          subject: t.subject || 'عام',
          classRoom: t.assignedClass || 'الصف الأول',
          visitDate: new Date().toISOString().split('T')[0],
          evaluatorId: currentUserId,
          evaluatorName: userData?.name || 'المشرف التربوي',
          evaluation: matchedEval || null
        };
      });
      setVisits(generated);
    }
  }, [teachers, evaluations, schoolId, currentUserId, userData?.name]);

  // Filtered visits
  const filteredVisits = visits.filter(v => {
    // Role filter
    if (isTeacher) {
      const isMyVisit = v.teacherId === currentUserId || v.teacherId === userData?.nationalId || v.teacherName === userData?.name;
      if (!isMyVisit) return false;
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
      const matchId = v.id?.toLowerCase().includes(q);
      return matchName || matchSubject || matchId;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'right' }} dir="rtl">
      {/* Top Banner & KPI Header */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.6rem' }}>🎯</span>
              <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>نظام متابعة وتقييم أداء المعلمين</h1>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              منظومة إلكترونية متكاملة للزيارات الصفية، معايير الأداء الديناميكية، تتبع القراءة، وحوكمة الصلاحيات
            </p>
          </div>

          {/* Role badge */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', background: isEvaluator ? '#eff6ff' : isTeacher ? '#f0fdf4' : '#faf5ff', color: isEvaluator ? '#1d4ed8' : isTeacher ? '#15803d' : '#7e22ce', border: '1px solid currentColor' }}>
              {isEvaluator ? '👨‍💼 شاشة المقيّم (إدارة / إشراف)' : isTeacher ? '👨‍🏫 شاشة المعلم (المُقيَّم)' : '👤 شاشة الزائر المعني'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedVisit ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedVisit(null)}
              className="btn"
              style={{ background: 'white', border: '1px solid var(--color-border)', fontWeight: 'bold', padding: '8px 18px', borderRadius: '10px' }}
            >
              ⬅ العودة لقائمة الزيارات
            </button>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              زيارة: {selectedVisit.id} • {selectedVisit.teacherName}
            </div>
          </div>

          {/* Render appropriate screen based on Role */}
          {isEvaluator && (
            <EvaluatorView
              visit={selectedVisit}
              initialEvaluation={selectedVisit.evaluation}
              currentUser={currentUser}
              onSaved={() => setSelectedVisit(null)}
            />
          )}

          {isTeacher && (
            selectedVisit.evaluation ? (
              <TeacherEvaluationView
                evaluation={selectedVisit.evaluation}
                currentUser={currentUser}
                onDecisionMade={() => setSelectedVisit(null)}
              />
            ) : (
              <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                لا يوجد تقييم متاح حتى الآن لهذه الزيارة.
              </div>
            )
          )}

          {isVisitor && (
            <VisitorEvaluationView
              rawEvaluation={selectedVisit.evaluation}
              visitId={selectedVisit.id}
            />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter & Search Bar */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', background: 'var(--color-bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="البحث باسم المعلم، التخصص، أو رقم الزيارة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          {/* Visits Grid / Table */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'var(--color-bg-card)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--color-text)' }}>
              سجل الزيارات الصفية وتقييم الأداء ({filteredVisits.length})
            </h3>

            {filteredVisits.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                لا توجد سجلات مطابقة للبحث أو الصلاحيات المتاحة.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
                      <th style={{ padding: '12px 10px' }}>رقم الزيارة</th>
                      <th style={{ padding: '12px 10px' }}>اسم المعلم</th>
                      <th style={{ padding: '12px 10px' }}>المادة والتخصص</th>
                      <th style={{ padding: '12px 10px' }}>تاريخ الزيارة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>الدرجة والنسبة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>حالة التقييم</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>مؤشر القراءة</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {filteredVisits.map((v) => {
                      const ev = v.evaluation;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0284c7' }}>{v.id}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>{v.teacherName}</td>
                          <td style={{ padding: '12px 10px', color: '#64748b' }}>{v.subject} ({v.classRoom})</td>
                          <td style={{ padding: '12px 10px', color: '#64748b' }}>{v.visitDate}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold' }}>
                            {ev ? (
                              <span style={{ color: ev.percentage >= 90 ? '#16a34a' : ev.percentage >= 75 ? '#0284c7' : '#d97706' }}>
                                {ev.percentage}% ({ev.totalEarnedScore}/{ev.totalMaxScore})
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
                            <button
                              onClick={() => setSelectedVisit(v)}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}
                            >
                              {isEvaluator ? (ev ? 'تعديل / متابعة' : 'تقييم الزيارة') : 'فتح التقييم'}
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
        </div>
      )}
    </div>
  );
}
