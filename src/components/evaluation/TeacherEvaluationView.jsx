import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Send, Printer } from 'lucide-react';
import { trackTeacherReadReceipt, handleTeacherDecision, calculateRating } from '../../services/evaluationService';

export default function TeacherEvaluationView({ evaluation, currentUser, onDecisionMade }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-log read timestamp in background on mount
  useEffect(() => {
    if (evaluation?.id && currentUser?.uid && !evaluation.readAt && evaluation.status !== 'draft') {
      trackTeacherReadReceipt(evaluation.id, currentUser.uid, evaluation)
        .then(() => console.log('Read receipt logged successfully'))
        .catch(err => console.error('Error logging read receipt:', err));
    }
  }, [evaluation?.id, currentUser?.uid]);

  const handleApprove = async () => {
    if (!window.confirm('هل أنت متأكد من موافقتك واعتماد نتيجة التقييم؟')) return;
    try {
      setIsProcessing(true);
      await handleTeacherDecision(evaluation.id, currentUser?.uid, 'approved', '', evaluation);
      alert('تم اعتماد نتيجة التقييم بنجاح.');
      if (onDecisionMade) onDecisionMade('approved');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      alert('يرجى توضيح سبب عدم الموافقة والمبررات بدقة.');
      return;
    }

    try {
      setIsProcessing(true);
      await handleTeacherDecision(evaluation.id, currentUser?.uid, 'rejected', rejectionReason, evaluation);
      setShowRejectModal(false);
      alert('تم رفع أسباب عدم الموافقة للإدارة التعليمية للنظر فيها.');
      if (onDecisionMade) onDecisionMade('rejected');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const header = evaluation.headerData || {};
  const criteria = evaluation.criteriaSnapshots || [];
  const rating = calculateRating(evaluation.percentage || 0);

  // Domains
  const domains = ['التخطيط', 'بناء خبرات التعلم', 'تقويم التعلم'];
  const otherDomains = [...new Set(criteria.map(c => c.domain))].filter(d => !domains.includes(d));
  const allDomains = [...domains, ...otherDomains];

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '20px' }} dir="rtl">
      
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7' }}>
            أداة الملاحظة الصفية لعام {header.academicYear || '1448هـ'}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0 0 0' }}>
            بطاقة تقييم الأداء المهني للمعلم: {header.teacherName || currentUser?.displayName || 'المعلم'}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            المادة: {header.subject || 'عام'} • التاريخ: {header.visitDate || 'اليوم'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn"
            style={{ background: 'white', border: '1px solid var(--color-border)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={16} /> طباعة
          </button>
          
          <div style={{ textAlign: 'left', background: rating.bg, padding: '8px 16px', borderRadius: '10px', border: `1px solid ${rating.color}` }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: rating.color }}>{evaluation.percentage}% ({rating.label})</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{evaluation.totalEarnedScore} من {evaluation.totalMaxScore} درجة</div>
          </div>
        </div>
      </div>

      {/* Header Metadata Info */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', background: '#f8fafc', padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
        <div><strong>المادة والتخصص:</strong> {header.subject} ({header.specialty})</div>
        <div><strong>المرحلة والصف:</strong> {header.stage} - {header.classroom}</div>
        <div><strong>الحصة وعدد الطلاب:</strong> {header.period} ({header.studentsCount} طالب)</div>
        <div><strong>وقت دخول المشرف:</strong> {header.entryTime} الحصة</div>
        {header.lessonTitle && <div style={{ gridColumn: 'span 2' }}><strong>عنوان موضوع الدرس:</strong> {header.lessonTitle}</div>}
      </div>

      {/* Criteria Table */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#0284c7', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: '14px' }}>
          بنود الممارسات الأدائية والدرجات المستحقة
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', fontSize: '12px', color: '#334155' }}>
                <th style={{ padding: '10px', width: '35px', textAlign: 'center' }}>م</th>
                <th style={{ padding: '10px', width: '110px' }}>المجال</th>
                <th style={{ padding: '10px' }}>الممارسات الأدائية</th>
                <th style={{ padding: '10px', textAlign: 'center', width: '100px' }}>الدرجة</th>
                <th style={{ padding: '10px', width: '160px' }}>ملاحظات المقيم</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '13px' }}>
              {allDomains.map((dom) => {
                const domainItems = criteria.filter(c => c.domain === dom);
                if (domainItems.length === 0) return null;

                return domainItems.map((item, itemIdx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                      {item.number || itemIdx + 1}
                    </td>
                    {itemIdx === 0 && (
                      <td
                        rowSpan={domainItems.length}
                        style={{
                          padding: '10px',
                          fontWeight: 800,
                          color: '#0369a1',
                          background: '#f0f9ff',
                          borderLeft: '1px solid #cbd5e1',
                          borderRight: '1px solid #cbd5e1',
                          verticalAlign: 'middle',
                          textAlign: 'center',
                          fontSize: '12px'
                        }}
                      >
                        {dom}
                      </td>
                    )}
                    <td style={{ padding: '10px', fontWeight: 600, color: '#1e293b' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1', background: 'rgba(2, 132, 199, 0.05)' }}>
                      {item.earnedScore} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>/ {item.maxScore}</span>
                    </td>
                    <td style={{ padding: '10px', color: '#475569', fontSize: '12px' }}>
                      {item.notes || '—'}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 2: Deliberation & Successes & Development Plan */}
      <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
        <div style={{ background: '#047857', color: 'white', padding: '10px 16px', fontWeight: 800, fontSize: '14px' }}>
          المداولة الإشرافية وخطة الدعم والتطوير
        </div>

        {/* Successes */}
        {evaluation.successes?.length > 0 && (
          <div style={{ padding: '14px', borderBottom: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
              النجاحات ومواطن التميز المرصودة:
            </h4>
            <ul style={{ margin: 0, paddingRight: '20px', fontSize: '13px', lineHeight: '1.8' }}>
              {evaluation.successes.filter(s => s.trim()).map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Development Plan */}
        {evaluation.developmentPlan?.length > 0 && (
          <div style={{ padding: '14px', borderBottom: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
              جوانب التطوير وخطة الدعم والمساندة:
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px' }}>م</th>
                    <th style={{ padding: '8px' }}>الكفايات المستهدفة</th>
                    <th style={{ padding: '8px' }}>محور التركيز</th>
                    <th style={{ padding: '8px' }}>الأسلوب الإشرافي</th>
                    <th style={{ padding: '8px' }}>الأسبوع المقترح</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.developmentPlan.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ padding: '8px' }}>{row.competency || '—'}</td>
                      <td style={{ padding: '8px' }}>{row.focusArea || '—'}</td>
                      <td style={{ padding: '8px' }}>{row.supervisoryMethod || '—'}</td>
                      <td style={{ padding: '8px' }}>{row.suggestedWeek || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {evaluation.evaluatorNotes && (
          <div style={{ padding: '14px', borderBottom: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>الملاحظات والتوصيات العامة:</div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>{evaluation.evaluatorNotes}</p>
          </div>
        )}

        <div style={{ background: '#fef3c7', padding: '8px 14px', color: '#92400e', fontSize: '11px', fontWeight: 'bold' }}>
          ملحوظة: تُجرى المداولة الإشرافية عقب الزيارة الصفية مباشرةً أو خلال اليوم الدراسي نفسه، ويُمنع تأجيلها.
        </div>
      </div>

      {/* Decision Section */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
        {evaluation.teacherDecision === 'approved' && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>تم اعتماد هذا التقييم والموافقة عليه من طرفك</div>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>تم توثيق موافقتك الرسمية وإغلاق سجل الزيارة.</div>
            </div>
          </div>
        )}

        {evaluation.teacherDecision === 'rejected' && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px' }}>
              <XCircle size={20} style={{ color: '#dc2626' }} /> لقد قمت بعدم الموافقة على هذا التقييم، وهو قيد المراجعة الإدارية
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', lineHeight: '1.6' }}>
              <strong>أسباب الرفض المرفوعة:</strong> {evaluation.rejectionReason}
            </div>
          </div>
        )}

        {evaluation.teacherDecision === 'pending' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '18px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#92400e' }}>
              <AlertTriangle size={24} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>مطلوب اتخاذ قرار للاعتماد</div>
                <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>يرجى تأكيد موافقتك على نتائج التقييم أو تسجيل المبررات وأسباب عدم الموافقة.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApprove}
                className="btn"
                style={{ background: '#16a34a', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle size={16} /> أوافق على التقييم
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowRejectModal(true)}
                className="btn"
                style={{ background: '#dc2626', color: 'white', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <XCircle size={16} /> لا أوافق (تقديم مبررات)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Rejection Modal */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }} dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <XCircle size={22} /> تسجيل أسباب عدم الموافقة على التقييم
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              يرجى كتابة المبررات والشواهد الداعمة لطلب مراجعة التقييم بدقة ليتم رفعها للإدارة التعليمية للنظر فيها.
            </p>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                required
                rows="5"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب أسباب الرفض والملاحظات التفصيلية هنا (إجباري)..."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600, padding: '8px 18px', borderRadius: '8px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn"
                  style={{ background: '#dc2626', color: 'white', fontWeight: 'bold', padding: '8px 20px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={16} /> إرسال أسباب الرفض للإدارة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
