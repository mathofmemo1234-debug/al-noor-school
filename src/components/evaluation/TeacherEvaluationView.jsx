import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Send } from 'lucide-react';
import { trackTeacherReadReceipt, handleTeacherDecision } from '../../services/evaluationService';

export default function TeacherEvaluationView({ evaluation, currentUser, onDecisionMade }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-log read timestamp in background on mount
  useEffect(() => {
    if (evaluation?.id && currentUser?.uid && !evaluation.readAt && evaluation.status !== 'draft') {
      trackTeacherReadReceipt(evaluation.id, currentUser.uid)
        .then(() => console.log('Read receipt logged successfully'))
        .catch(err => console.error('Error logging read receipt:', err));
    }
  }, [evaluation?.id, currentUser?.uid]);

  const handleApprove = async () => {
    if (!window.confirm('هل أنت متأكد من موافقتك واعتماد نتيجة التقييم؟')) return;
    try {
      setIsProcessing(true);
      await handleTeacherDecision(evaluation.id, currentUser.uid, 'approved');
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
      alert('يرجى توضيح سبب الرفض بالتفصيل.');
      return;
    }

    try {
      setIsProcessing(true);
      await handleTeacherDecision(evaluation.id, currentUser.uid, 'rejected', rejectionReason);
      setShowRejectModal(false);
      alert('تم رفع أسباب الرفض للإدارة لمراجعة التقييم.');
      if (onDecisionMade) onDecisionMade('rejected');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'var(--color-bg-card)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>بطاقة تقييم الأداء المهني للمعلم</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            المقيم: {evaluation.evaluatorName || 'المشرف التربوي'} | تاريخ التقييم: {evaluation.sentAt ? new Date(evaluation.sentAt).toLocaleDateString('ar-SA') : 'اليوم'}
          </p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7' }}>{evaluation.percentage}%</div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{evaluation.totalEarnedScore} من {evaluation.totalMaxScore} درجة</div>
        </div>
      </div>

      {/* Read-Only Criteria Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '2px solid var(--color-border)', fontSize: '13px', color: '#475569' }}>
              <th style={{ padding: '12px 10px' }}>#</th>
              <th style={{ padding: '12px 10px' }}>معيار الأداء</th>
              <th style={{ padding: '12px 10px' }}>المجال</th>
              <th style={{ padding: '12px 10px', textAlign: 'center', width: '130px' }}>الدرجة المستحقة</th>
              <th style={{ padding: '12px 10px' }}>ملاحظات المقيم</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {evaluation.criteriaSnapshots?.map((item, idx) => (
              <tr key={item.criteriaId || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>{item.category}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1', background: 'rgba(2, 132, 199, 0.04)' }}>
                  {item.earnedScore} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>/ {item.maxScore}</span>
                </td>
                <td style={{ padding: '10px', color: '#475569', fontSize: '12px' }}>{item.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evaluator Notes */}
      {evaluation.evaluatorNotes && (
        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>التوجيهات والملاحظات العامة للمقيم:</div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>{evaluation.evaluatorNotes}</p>
        </div>
      )}

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

      {/* Mandatory Rejection Reason Modal */}
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
