import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { CheckSquare, Plus, Save } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function TeacherTasks() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>مهام اليوم</h2>
        <button className="btn btn-primary btn-sm"><Plus size={16} /> إضافة مهمة</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '4px solid var(--color-primary)' }}>
          <CheckSquare color="var(--color-text-muted)" />
          <span>تصحيح واجب الرياضيات للصف الأول متوسط</span>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center', borderLeft: '4px solid var(--color-secondary)' }}>
          <CheckSquare color="var(--color-text-muted)" />
          <span>إعداد اختبار قصير للفصل 2/أ</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyPlan() {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const [plan, setPlan] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing plan (optional, but good for UX)
  React.useEffect(() => {
    const fetchPlan = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'weekly_plans', auth.currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPlan(snap.data().plan || {});
      }
    };
    fetchPlan();
  }, []);

  const handleChange = (day, field, value) => {
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!auth.currentUser) return alert('يجب تسجيل الدخول أولاً');
    setIsSaving(true);
    try {
      const docRef = doc(db, 'weekly_plans', auth.currentUser.uid);
      await setDoc(docRef, { 
        teacherId: auth.currentUser.uid,
        plan: plan,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('تم حفظ الخطة الأسبوعية بنجاح!');
    } catch (error) {
      console.error("Error saving plan:", error);
      alert('حدث خطأ أثناء الحفظ. (ربما بسبب صلاحيات Firebase)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>الخطة الأسبوعية</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ الخطة'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {days.map(day => (
          <div key={day} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ borderBottom: '2px solid var(--color-bg)', paddingBottom: '10px', marginBottom: '16px', color: 'var(--color-primary-dark)' }}>{day}</h3>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>موضوع الدرس</label>
                <input 
                  type="text" 
                  placeholder="اكتب عنوان وموضوع الدرس هنا..." 
                  value={plan[day]?.topic || ''}
                  onChange={(e) => handleChange(day, 'topic', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>الأهداف التعليمية</label>
                <input 
                  type="text" 
                  placeholder="ما الذي سيتعلمه الطالب؟" 
                  value={plan[day]?.goals || ''}
                  onChange={(e) => handleChange(day, 'goals', e.target.value)}
                />
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}

function Assignments() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>إدارة الواجبات</h2>
        <button className="btn btn-primary"><Plus size={18} /> واجب جديد</button>
      </div>
      <p style={{ color: 'var(--color-text-muted)' }}>لا توجد واجبات مضافة حالياً. ابدأ بإضافة واجب جديد للطلاب.</p>
    </div>
  );
}

function Attendance() {
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2>سجل الغياب والحضور</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>اختر الفصل الدراسي لتسجيل الحضور والغياب لليوم.</p>
      {/* Table placeholder */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', marginTop: '20px', textAlign: 'center' }}>
        سيتم عرض قائمة الطلاب هنا
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Layout role="teacher" title="لوحة تحكم المعلم">
      <Routes>
        <Route path="/" element={<TeacherTasks />} />
        <Route path="/weekly-plan" element={<WeeklyPlan />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/attendance" element={<Attendance />} />
      </Routes>
    </Layout>
  );
}
