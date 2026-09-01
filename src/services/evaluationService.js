import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

/**
 * بنود استمارة الملاحظة الصفية الرسمية لعام 1448هـ (شركة المدارس المتقدمة)
 * 20 بنداً مقسمة على 3 مجالات أساسية: التخطيط، بناء خبرات التعلم، تقويم التعلم
 */
export const OFFICIAL_CRITERIA_TEMPLATE = [
  // المجال 1: التخطيط
  {
    id: 'crit_1',
    number: 1,
    domain: 'التخطيط',
    name: 'يتوافق تنفيذ محتوى المناهج مع الخطة الزمنية لتوزيع المنهج.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_2',
    number: 2,
    domain: 'التخطيط',
    name: 'يخطط المعلم لخبرات تعلم جذابة ومحفزة، تتضمن أنشطة تطبيقية تحقق التكامل بين المواد، وفق مبدأ التعلم المتمركز حول المتعلم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_3',
    number: 3,
    domain: 'التخطيط',
    name: 'يوظف المعلم الحقيبة لاستثارة المعرفة السابقة، ورفع جاهزية المتعلمين، ومعالجة الفاقد التعليمي.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },

  // المجال 2: بناء خبرات التعلم
  {
    id: 'crit_4',
    number: 4,
    domain: 'بناء خبرات التعلم',
    name: 'تتيح بيئة التعلم مصادر وأنشطة متنوعة تلبي احتياجات المتعلمين المختلفة.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_5',
    number: 5,
    domain: 'بناء خبرات التعلم',
    name: 'يُستثمر وقت التعلم بفاعلية بما يدعم تعلم المتعلمين ويلبي احتياجاتهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_6',
    number: 6,
    domain: 'بناء خبرات التعلم',
    name: 'تتاح لجميع المتعلمين فرص متكافئة للمشاركة في الأنشطة والمناقشات واستخدام مصادر التعلم المتنوعة.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_7',
    number: 7,
    domain: 'بناء خبرات التعلم',
    name: 'تتنوع استراتيجيات التعلم والتعليم بما يلبي احتياجات المتعلمين ويدعم تعلمهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_8',
    number: 8,
    domain: 'بناء خبرات التعلم',
    name: 'تشجع بيئة التعلم على استخدام التقنية الرقمية لدعم تعلم المتعلمين وتلبية احتياجاتهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_9',
    number: 9,
    domain: 'بناء خبرات التعلم',
    name: 'تركز أنشطة التعلم على تطبيقات عملية ترتبط بحياة المتعلمين.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_10',
    number: 10,
    domain: 'بناء خبرات التعلم',
    name: 'يوظف المتعلمون مهارات القراءة والكتابة، والمهارات العددية (الحساب) المرتبطة بالموقف التعليمي.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_11',
    number: 11,
    domain: 'بناء خبرات التعلم',
    name: 'يمارس المتعلمون مهارات التفكير والبحث والابتكار بما يلائم الموقف التعليمي.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_12',
    number: 12,
    domain: 'بناء خبرات التعلم',
    name: 'تنمي بيئة التعلم المهارات العاطفية والاجتماعية لدى المتعلمين.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_13',
    number: 13,
    domain: 'بناء خبرات التعلم',
    name: 'تدعم بيئة التعلم تنفيذ المنهج بما يحقق نواتج التعلم المستهدفة.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_14',
    number: 14,
    domain: 'بناء خبرات التعلم',
    name: 'تتضمن بيئة التعلم محفزات متنوعة تعزز دافعية المتعلمين.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_15',
    number: 15,
    domain: 'بناء خبرات التعلم',
    name: 'يشارك المتعلمون في أنشطة التعلم بفاعلية ويستمتعون بها.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },

  // المجال 3: تقويم التعلم
  {
    id: 'crit_16',
    number: 16,
    domain: 'تقويم التعلم',
    name: 'تتيح مهام التقويم للمتعلمين فرصاً متنوعة لإظهار تعلمهم والكشف عن مستويات أدائهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_17',
    number: 17,
    domain: 'تقويم التعلم',
    name: 'تُستخدم أساليب وأدوات تقويم متنوعة لقياس تحقق نواتج التعلم المستهدفة.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_18',
    number: 18,
    domain: 'تقويم التعلم',
    name: 'يتلقى المتعلمون تغذية راجعة واضحة ويستفيدون منها في تحسين أدائهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_19',
    number: 19,
    domain: 'تقويم التعلم',
    name: 'تُوظف نتائج التقويم الصفي في تعديل مسار التعلم ومعالجة جوانب التعثر أثناء الحصة.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  },
  {
    id: 'crit_20',
    number: 20,
    domain: 'تقويم التعلم',
    name: 'يكلف المعلم المتعلمين بمهام منزلية هادفة، ويتابع تنفيذها، ويقدم تغذية راجعة تسهم في تحسين تعلمهم.',
    maxScore: 5,
    earnedScore: 5,
    notes: ''
  }
];

/**
 * حساب التقدير العام بناءً على النسبة
 */
export function calculateRating(percentage) {
  if (percentage >= 90) return { label: 'ممتاز', color: '#16a34a', bg: '#dcfce7' };
  if (percentage >= 80) return { label: 'جيد جداً', color: '#0284c7', bg: '#e0f2fe' };
  if (percentage >= 70) return { label: 'جيد / مرضٍ', color: '#d97706', bg: '#fef3c7' };
  return { label: 'غير مرضٍ', color: '#dc2626', bg: '#fee2e2' };
}

/**
 * إنشاء زيارة صفية جديدة مع ترقيم تلقائي متسلسل
 */
export async function createClassroomVisit(visitData, schoolId) {
  const q = query(
    collection(db, 'classroom_visits'),
    where('schoolId', '==', schoolId)
  );
  const snap = await getDocs(q);
  const existingVisits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // رقم الزيارة المتسلسل
  const nextSeq = existingVisits.length + 1;
  const visitNumber = `VIS-${nextSeq}`;

  const payload = {
    ...visitData,
    schoolId,
    seqNumber: nextSeq,
    visitNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'classroom_visits'), payload);
  return { id: docRef.id, ...payload };
}

/**
 * حذف زيارة وإعادة ترقيم جميع الزيارات المتبقية تسلسلياً (Re-indexing sequence)
 */
export async function deleteVisitAndRenumber(visitDocId, schoolId) {
  // 1. حذف الزيارة المحددة
  await deleteDoc(doc(db, 'classroom_visits', visitDocId));

  // حذف التقييم المرتبط بها إن وجد
  try {
    const qEval = query(collection(db, 'evaluations'), where('visitId', '==', visitDocId));
    const evalSnap = await getDocs(qEval);
    for (let d of evalSnap.docs) {
      await deleteDoc(doc(db, 'evaluations', d.id));
    }
  } catch (e) {
    console.error('Error cleaning up evaluations:', e);
  }

  // 2. جلب جميع الزيارات المتبقية وإعادة ترقيمها
  const q = query(collection(db, 'classroom_visits'), where('schoolId', '==', schoolId));
  const snap = await getDocs(q);
  const visits = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // فرز حسب تاريخ الإنشاء أو الرقم القديم
  visits.sort((a, b) => (a.seqNumber || 0) - (b.seqNumber || 0));

  const batch = writeBatch(db);
  visits.forEach((v, index) => {
    const newSeq = index + 1;
    const newVisitNumber = `VIS-${newSeq}`;
    const vRef = doc(db, 'classroom_visits', v.id);
    batch.update(vRef, {
      seqNumber: newSeq,
      visitNumber: newVisitNumber,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
  return true;
}

/**
 * حفظ التقييم كمسودة
 */
export async function saveEvaluationDraft(evalData, evaluatorId) {
  const { id, visitId, teacherId, criteriaSnapshots, successes, developmentPlan, evaluatorNotes, schoolId, headerData } = evalData;
  
  const totalMax = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const totalEarned = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(2)) : 0;
  const rating = calculateRating(percentage);

  const payload = {
    visitId: visitId || '',
    schoolId: schoolId || '',
    teacherId: teacherId || '',
    evaluatorId: evaluatorId || '',
    status: 'draft',
    headerData: headerData || {},
    criteriaSnapshots: criteriaSnapshots || OFFICIAL_CRITERIA_TEMPLATE,
    successes: successes || [''],
    developmentPlan: developmentPlan || [],
    totalMaxScore: totalMax,
    totalEarnedScore: totalEarned,
    percentage,
    rating: rating.label,
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
 * إرسال واعتماد التقييم للمعلم
 */
export async function submitEvaluation(evalData, evaluatorId) {
  const { id, visitId, teacherId, criteriaSnapshots, successes, developmentPlan, evaluatorNotes, schoolId, headerData } = evalData;

  const totalMax = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const totalEarned = (criteriaSnapshots || []).reduce((sum, item) => sum + Number(item.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(2)) : 0;
  const rating = calculateRating(percentage);

  const payload = {
    visitId: visitId || '',
    schoolId: schoolId || '',
    teacherId: teacherId || '',
    evaluatorId: evaluatorId || '',
    status: 'sent',
    sentAt: serverTimestamp(),
    headerData: headerData || {},
    criteriaSnapshots: criteriaSnapshots || OFFICIAL_CRITERIA_TEMPLATE,
    successes: successes || [''],
    developmentPlan: developmentPlan || [],
    totalMaxScore: totalMax,
    totalEarnedScore: totalEarned,
    percentage,
    rating: rating.label,
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
 * إنشاء نموذج تقييم رسمي مكتمل ومطابق لعام 1448هـ لأي زيارة
 */
export function getSampleEvaluationForVisit(visit) {
  const criteria = OFFICIAL_CRITERIA_TEMPLATE.map(c => ({
    ...c,
    earnedScore: (c.number === 7 || c.number === 19) ? 4 : 5,
    notes: c.number === 1 ? 'متميز ومتوافق تماماً مع الخطة الزمنية لتوزيع المنهج.' :
           c.number === 8 ? 'توظيف رائع للشاشة التفاعلية والتطبيقات السحابية.' :
           c.number === 15 ? 'تفاعل نشط وحماس ملحوظ من كافة الطلاب.' : ''
  }));

  const totalMax = criteria.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const totalEarned = criteria.reduce((sum, item) => sum + Number(item.earnedScore || 0), 0);
  const percentage = totalMax > 0 ? Number(((totalEarned / totalMax) * 100).toFixed(1)) : 0;
  const rating = calculateRating(percentage);

  const visitIdStr = visit?.id || visit?.visitNumber || 'VIS-1';

  return {
    id: `eval_${visitIdStr}`,
    visitId: visitIdStr,
    schoolId: visit?.schoolId || 'school_001',
    teacherId: visit?.teacherId || '',
    evaluatorId: visit?.evaluatorId || 'evaluator_001',
    status: 'sent',
    headerData: {
      academicYear: '1448هـ',
      semester: 'الفصل الدراسي الأول',
      department: 'القسم التعليمي',
      educationalComplex: 'مجمع المدارس المتقدمة',
      visitDay: 'الأحد',
      visitDate: visit?.visitDate || new Date().toISOString().split('T')[0],
      subject: visit?.subject || 'عام',
      specialty: visit?.specialty || visit?.subject || 'عام',
      teacherName: visit?.teacherName || 'المعلم',
      nationality: visit?.nationality || 'سعودي',
      stage: visit?.stage || 'المرحلة الثانوية',
      classroom: visit?.classRoom || 'الصف الأول الثانوي',
      period: visit?.period || 'الحصة الثالثة',
      studentsCount: visit?.studentsCount || '26',
      entryTime: 'بداية',
      lessonTitle: visit?.lessonTitle || 'درس تطبيقي واستراتيجيات التعلم النشط'
    },
    criteriaSnapshots: criteria,
    successes: [
      'التفاعل الإيجابي والمشاركة الفعالة من غالبية الطلاب أثناء تنفيذ الأنشطة الصفية.',
      'الاستثمار المميز للتقنيات والوسائل التعليمية الرقمية والتطبيقات التفاعلية.',
      'الربط الرائع بين محتوى الدرس والتطبيقات الحياتية المعاصرة للطلاب.'
    ],
    developmentPlan: [
      {
        id: 'plan_1',
        competency: 'تنويع استراتيجيات التقويم المرحلي أثناء الدرس',
        focusArea: 'التقويم الصفي المستمر ومراعاة الفروق الفردية',
        supervisoryMethod: 'حصة تطبيقية',
        suggestedWeek: 'الأسبوع القادم'
      }
    ],
    totalMaxScore: totalMax,
    totalEarnedScore: totalEarned,
    percentage,
    rating: rating.label,
    evaluatorNotes: 'أداء صفي رفيع المستوى واستثمار ممتاز لزمن الحصة مع استثارة دافعية المتعلمين.',
    teacherDecision: 'pending',
    rejectionReason: null
  };
}

/**
 * تسجيل وقت القراءة آلياً
 */
export async function trackTeacherReadReceipt(evaluationId, teacherId, fallbackData = null) {
  if (!evaluationId) return { success: false };
  try {
    const evalRef = doc(db, 'evaluations', evaluationId);
    const snap = await getDoc(evalRef);

    if (!snap.exists()) {
      if (fallbackData) {
        await setDoc(evalRef, {
          ...fallbackData,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, readRecorded: true };
      }
      return { success: false };
    }

    const data = snap.data();
    if (!data.readAt && data.status !== 'draft') {
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
 * معالجة قرار المعلم
 */
export async function handleTeacherDecision(evaluationId, teacherId, decision, rejectionReason = '', fallbackData = null) {
  if (!evaluationId) throw new Error('معرف التقييم مطلوب');
  const evalRef = doc(db, 'evaluations', evaluationId);
  const snap = await getDoc(evalRef);

  const isReject = decision === 'rejected';
  if (isReject && (!rejectionReason || rejectionReason.trim().length < 5)) {
    throw new Error('يجب توضيح سبب الرفض والمبررات بدقة.');
  }

  if (!snap.exists()) {
    // Save new doc with decision
    const baseData = fallbackData || getSampleEvaluationForVisit({ id: evaluationId, teacherId });
    await setDoc(evalRef, {
      ...baseData,
      status: decision,
      teacherDecision: decision,
      rejectionReason: isReject ? rejectionReason.trim() : null,
      decidedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, status: decision };
  }

  const data = snap.data();

  if (data.status === 'draft') {
    throw new Error('لا يمكن اتخاذ قرار على تقييم لا يزال مسودة');
  }

  if (isReject) {
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
 * تصفية البيانات للزائر
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
