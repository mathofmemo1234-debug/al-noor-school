import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { CheckSquare, Square, Plus, Save, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';

function TeacherTasks() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'tasks'),
      where('teacherId', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      // Sort so incomplete tasks are at the top
      tasksData.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !auth.currentUser) return;
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        completed: false,
        teacherId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error adding task:", error);
      alert('تعذر إضافة المهمة، يرجى التأكد من صلاحيات قاعدة البيانات');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed
      });
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>مهام اليوم</h2>
      </div>
      
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="أدخل مهمة جديدة..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
        />
        <button type="submit" className="btn btn-primary" disabled={isAdding || !newTaskTitle.trim()}>
          <Plus size={16} /> إضافة مهمة
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>لا توجد مهام حالياً. يمكنك إضافة مهام جديدة!</p>
        ) : (
          tasks.map(task => (
            <div key={task.id} style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center', 
              borderLeft: `4px solid ${task.completed ? 'var(--color-text-muted)' : 'var(--color-primary)'}`,
              opacity: task.completed ? 0.7 : 1
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', flex: 1 }} onClick={() => toggleTask(task)}>
                {task.completed ? <CheckSquare color="var(--color-primary)" /> : <Square color="var(--color-text-muted)" />}
                <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
              </div>
              <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
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
