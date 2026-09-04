import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Trash2, PlusCircle, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Migration() {
  const navigate = useNavigate();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString('ar-SA')}: ${msg}`]);

  const alNoorSchools = [
    {
      id: "al_noor_boys",
      name: "مجمع مدارس النور الأهلية للبنين",
      city: "جدة",
      curriculumType: "saudi",
      defaultLanguage: "ar",
      stages: ["primary", "intermediate", "secondary"],
      status: "active"
    },
    {
      id: "al_noor_girls",
      name: "مجمع مدارس النور الأهلية للبنات",
      city: "جدة",
      curriculumType: "saudi",
      defaultLanguage: "ar",
      stages: ["primary", "intermediate", "secondary"],
      status: "active"
    },
    {
      id: "al_noor_international",
      name: "مدارس النور العالمية (Al-Noor International School)",
      city: "جدة",
      curriculumType: "american",
      defaultLanguage: "en",
      stages: ["primary", "intermediate", "secondary"],
      status: "active"
    },
    {
      id: "al_noor_quran_boys",
      name: "مجمع مدارس النور لتحفيظ القرآن الكريم (بنين)",
      city: "جدة",
      curriculumType: "holy_quran",
      defaultLanguage: "ar",
      stages: ["primary", "intermediate", "secondary"],
      status: "active"
    },
    {
      id: "al_noor_quran_girls",
      name: "مجمع مدارس النور لتحفيظ القرآن الكريم (بنات)",
      city: "جدة",
      curriculumType: "holy_quran",
      defaultLanguage: "ar",
      stages: ["primary", "intermediate", "secondary"],
      status: "active"
    },
    {
      id: "al_noor_kindergarten",
      name: "روضة وحضانة النور النموذجية للأطفال",
      city: "جدة",
      curriculumType: "saudi",
      defaultLanguage: "ar",
      stages: ["kindergarten"],
      status: "active"
    }
  ];

  // 1. Seed Al Noor Schools
  const seedAlNoorSchools = async () => {
    setLoading(true);
    addLog("🚀 بدء إضافة وتثبيت مجمعات مدارس النور الأهلية في قاعدة البيانات...");
    try {
      for (const s of alNoorSchools) {
        addLog(`إضافة مجمع: ${s.name} (${s.id})`);
        await setDoc(doc(db, 'schools', s.id), {
          ...s,
          updatedAt: new Date(),
          createdAt: new Date()
        });
      }
      addLog("✅ تم تسجيل وتثبيت كافة مجمعات مدارس النور بنجاح!");
    } catch (error) {
      addLog("❌ خطأ أثناء الإضافة: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Clean up & Purge legacy Motaqadema data
  const purgeMotaqademaData = async () => {
    if (!window.confirm("هل أنت متأكد من حذف وتنظيف أي مجمعات أو بيانات تخص مدارس المتقدمة السابقة من قاعدة البيانات نهائياً؟")) {
      return;
    }
    setLoading(true);
    addLog("🧹 بدء فحص وتنظيف قاعدة البيانات من أي بيانات قديمة لمدارس المتقدمة...");
    try {
      // Clean schools collection
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      let deletedCount = 0;
      for (const d of schoolsSnap.docs) {
        const data = d.data();
        const name = (data.name || '').trim();
        const id = d.id;
        const isLegacy = 
          name.includes('المتقدمة') || 
          name.includes('العقيق') || 
          name.includes('نيار') || 
          name.includes('أمجاد قرطبة') || 
          name.includes('علوم الرياض') || 
          name.includes('جواثا') || 
          name.includes('مناهل البكيرية') ||
          id.includes('msc') ||
          id.includes('motaqadema') ||
          id.includes('motqadema');

        if (isLegacy) {
          addLog(`🗑️ حذف مدرسة سابقة: ${name} [${id}]`);
          await deleteDoc(doc(db, 'schools', id));
          deletedCount++;
        }
      }
      addLog(`✨ اكتمل التنظيف! تم حذف ${deletedCount} مجمع قديم من قاعدة البيانات.`);
    } catch (error) {
      addLog("❌ خطأ أثناء التنظيف: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Initialize/Reset Super Admin user document
  const initSuperAdminUser = async () => {
    setLoading(true);
    addLog("👑 جاري تهيئة حساب الماستر العام لمدارس النور في قاعدة البيانات...");
    try {
      const superDoc = {
        name: "حساب الماستر العام - مدارس النور",
        email: "super@admin.com",
        role: "superadmin",
        schoolId: "ALL",
        schoolName: "جميع المدارس (الماستر العام)",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', 'super_master_alnoor'), superDoc);
      addLog("✅ تم تسجيل بيانات الماستر العام في كولكشن users بنجاح!");
    } catch (error) {
      addLog("❌ خطأ أثناء تهيئة الماستر: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0e7490', fontSize: '24px', fontWeight: 800 }}>
            إدارة وتهيئة قاعدة بيانات مدارس النور الأهلية
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            أدوات الترحيل والتنظيف وحذف بيانات مدارس المتقدمة السابقة وعزل النظام
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn"
          style={{ background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1' }}
        >
          <ArrowRight size={18} /> العودة لصفحة الدخول
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Seed Button */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#059669', marginBottom: '12px' }}>
            <PlusCircle size={22} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>1. إضافة مجمعات مدارس النور</h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            تثبيت مجمعات مدارس النور (بنين، بنات، عالمي، تحفيظ، ورياض أطفال) في قاعدة البيانات.
          </p>
          <button
            onClick={seedAlNoorSchools}
            disabled={loading}
            style={{ width: '100%', background: '#059669', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
          >
            {loading ? 'جاري التنفيذ...' : 'إضافة مجمعات مدارس النور'}
          </button>
        </div>

        {/* Purge Legacy Data Button */}
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
            <Trash2 size={22} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>2. تنظيف وحذف بيانات المتقدمة</h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            حذف أي مجمعات أو سجلات سابقة تعود لمدارس المتقدمة من قاعدة بيانات Firestore نهائياً.
          </p>
          <button
            onClick={purgeMotaqademaData}
            disabled={loading}
            style={{ width: '100%', background: '#dc2626', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
          >
            {loading ? 'جاري التنفيذ...' : 'حذف بيانات المتقدمة السابقة'}
          </button>
        </div>

        {/* Initialize Super Admin Master */}
        <div style={{ background: '#ffffff', border: '1px solid #e0f2fe', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0284c7', marginBottom: '12px' }}>
            <ShieldCheck size={22} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>3. تهيئة حساب الماستر</h3>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            تسجيل وتحديث وثيقة حساب السوبر ماستر العام لمدارس النور في كولكشن users.
          </p>
          <button
            onClick={initSuperAdminUser}
            disabled={loading}
            style={{ width: '100%', background: '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
          >
            {loading ? 'جاري التنفيذ...' : 'تهيئة حساب الماستر'}
          </button>
        </div>
      </div>

      {/* Execution Log */}
      <div style={{ background: '#0f172a', color: '#e2e8f0', padding: '18px', borderRadius: '14px', minHeight: '260px', maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #334155' }}>
        <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
          سجل العمليات (Execution Logs):
        </div>
        {log.length === 0 ? (
          <div style={{ color: '#64748b', fontStyle: 'italic' }}>اضغط على أي من العمليات أعلاه لبدء التنفيذ وعرض السجل هنا...</div>
        ) : (
          log.map((l, i) => <div key={i} style={{ marginBottom: '4px', lineHeight: 1.5 }}>{l}</div>)
        )}
      </div>
    </div>
  );
}

