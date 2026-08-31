import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';

/**
 * Save evaluation as Draft (Hidden from teacher & visitor)
 */
export async function saveEvaluationDraft(evalData, evaluatorId) {
  const { id, visitId, teacherId, criteriaSnapshots, evaluatorNotes, schoolId } = evalData;
  
  const totalMax = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const totalEarned = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(2)) : 0;

  const payload = {
    visitId: visitId || '',
    schoolId: schoolId || '',
    teacherId: teacherId || '',
    evaluatorId: evaluatorId || '',
    status: 'draft',
    criteriaSnapshots: criteriaSnapshots || [],
    totalMaxScore: totalMax,
    totalEarnedScore: totalEarned,
    percentage,
    evaluatorNotes: evaluatorNotes || '',
    teacherDecision: 'pending',
    rejectionReason: null,
    updatedAt: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, 'evaluations', id), payload);
    return { id, ...payload };
  } else {
    payload.createdAt = serverTimestamp();
    payload.readAt = null;
    const docRef = await addDoc(collection(db, 'evaluations'), payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Submit & Send evaluation to teacher & visitor
 */
export async function submitEvaluation(evalData, evaluatorId) {
  const { id, visitId, teacherId, criteriaSnapshots, evaluatorNotes, schoolId } = evalData;

  const totalMax = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const totalEarned = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(2)) : 0;

  const payload = {
    visitId: visitId || '',
    schoolId: schoolId || '',
    teacherId: teacherId || '',
    evaluatorId: evaluatorId || '',
    status: 'sent',
    sentAt: serverTimestamp(),
    criteriaSnapshots: criteriaSnapshots || [],
    totalMaxScore: totalMax,
    totalEarnedScore: totalEarned,
    percentage,
    evaluatorNotes: evaluatorNotes || '',
    teacherDecision: 'pending',
    rejectionReason: null,
    updatedAt: serverTimestamp()
  };

  if (id) {
    await updateDoc(doc(db, 'evaluations', id), payload);
    return { id, ...payload };
  } else {
    payload.createdAt = serverTimestamp();
    payload.readAt = null;
    const docRef = await addDoc(collection(db, 'evaluations'), payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Automatically log teacher's read timestamp in background
 */
export async function trackTeacherReadReceipt(evaluationId, teacherId) {
  if (!evaluationId || !teacherId) return { success: false };
  try {
    const evalRef = doc(db, 'evaluations', evaluationId);
    const snap = await getDoc(evalRef);

    if (!snap.exists()) return { success: false };
    const data = snap.data();

    if (data.teacherId === teacherId && !data.readAt && data.status !== 'draft') {
      await updateDoc(evalRef, {
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, readRecorded: true };
    }
    return { success: true, readRecorded: false };
  } catch (err) {
    console.error('Error recording read receipt:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Handle Teacher's decision (Approve or Reject with mandatory reason)
 */
export async function handleTeacherDecision(evaluationId, teacherId, decision, rejectionReason = '') {
  if (!evaluationId) throw new Error('معرف التقييم مطلوب');
  const evalRef = doc(db, 'evaluations', evaluationId);
  const snap = await getDoc(evalRef);

  if (!snap.exists()) throw new Error('التقييم غير موجود');
  const data = snap.data();

  if (data.teacherId !== teacherId) {
    throw new Error('غير مصرح لك باتخاذ قرار على هذا التقييم');
  }

  if (data.status === 'draft') {
    throw new Error('لا يمكن اتخاذ قرار على تقييم لا يزال مسودة');
  }

  if (decision === 'rejected') {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new Error('يجب توضيح سبب الرفض والمبررات بدقة.');
    }

    await updateDoc(evalRef, {
      status: 'rejected',
      teacherDecision: 'rejected',
      rejectionReason: rejectionReason.trim(),
      decidedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, status: 'rejected' };
  } else if (decision === 'approved') {
    await updateDoc(evalRef, {
      status: 'approved',
      teacherDecision: 'approved',
      rejectionReason: null,
      decidedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, status: 'approved' };
  } else {
    throw new Error('القرار غير صالح');
  }
}

/**
 * Data Sanitizer for Visitor role - Strip rejection reason & enforce review banner
 */
export function sanitizeForVisitor(evaluation) {
  if (!evaluation) return null;
  if (evaluation.status === 'draft') return null;

  const sanitized = { ...evaluation };
  if (sanitized.status === 'rejected' || sanitized.teacherDecision === 'rejected') {
    delete sanitized.rejectionReason;
    sanitized.isUnderReview = true;
  }
  delete sanitized.readAt;
  return sanitized;
}
