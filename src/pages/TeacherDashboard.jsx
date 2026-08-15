import Settings from './Settings';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, FileText, Users, X, Edit, Trash2, CheckSquare, Square, Plus, Save, Award } from 'lucide-react';
import { db, auth } from '../firebase';
import TeacherSchedule from './TeacherSchedule';
import { doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import LessonPreparation from './LessonPreparation';
import MaterialsUpload from './MaterialsUpload';
import TeacherExams from './TeacherExams';
import TeacherExcellence from './TeacherExcellence';

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
  const WEEKS = Array.from({length: 18}, (_, i) => `الأسبوع ${i + 1}`);
  const [plan, setPlan] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(WEEKS[0]);
  const [classesList, setClassesList] = useState([]);
  const [planDocId, setPlanDocId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { userData } = useAuth();
  const [teacherDocId, setTeacherDocId] = useState(null);

  // Fetch teacher doc ID based on nationalId
  useEffect(() => {
    if (userData?.nationalId) {
      const unsub = onSnapshot(query(collection(db, 'teachers'), where('nationalId', '==', userData.nationalId)), (snap) => {
        if (!snap.empty) {
          setTeacherDocId(snap.docs[0].id);
        } else {
          setTeacherDocId(null);
        }
      });
      return () => unsub();
    }
  }, [userData]);

  // Fetch available classes for this teacher based on their schedule
  useEffect(() => {
    if (!teacherDocId) {
      setClassesList([]);
      return;
    }
    
    // First fetch all classes to get their names
    const unsubClasses = onSnapshot(collection(db, 'classes'), (classesSnap) => {
      const classNames = {};
      classesSnap.docs.forEach(d => classNames[d.id] = d.data().name);
      
      // Then fetch schedules to see which classes this teacher teaches
      const unsubSchedules = onSnapshot(collection(db, 'schedules'), (schedulesSnap) => {
        const myClassNames = new Set();
        schedulesSnap.docs.forEach(docSnap => {
          const matrix = docSnap.data().matrix || {};
          let isTeaching = false;
          Object.values(matrix).forEach(cell => {
            if (cell.teacherId === teacherDocId) {
              isTeaching = true;
            }
          });
          if (isTeaching && classNames[docSnap.id]) {
            myClassNames.add(classNames[docSnap.id]);
          }
        });
        setClassesList(Array.from(myClassNames));
      });
      
      return () => unsubSchedules();
    });
    
    return () => unsubClasses();
  }, [teacherDocId]);

  // Fetch existing plan for selected class
  useEffect(() => {
    if (!auth.currentUser || !selectedClass) {
      setPlan({});
      setPlanDocId(null);
      return;
    }
    const q = query(
      collection(db, 'weekly_plans'),
      where('teacherId', '==', teacherDocId),
      where('className', '==', selectedClass),
      where('week', '==', selectedWeek)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setPlan(snapshot.docs[0].data().plan || {});
        setPlanDocId(snapshot.docs[0].id);
      } else {
        setPlan({});
        setPlanDocId(null);
      }
    });
    return () => unsub();
  }, [selectedClass, selectedWeek]);

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
    if (!selectedClass) return alert('يرجى اختيار الفصل');
    setIsSaving(true);
    try {
      const payload = {
        teacherId: teacherDocId,
        teacherEmail: auth.currentUser.email,
        className: selectedClass,
        week: selectedWeek,
        plan: plan,
        updatedAt: new Date().toISOString()
      };

      if (planDocId) {
        await updateDoc(doc(db, 'weekly_plans', planDocId), payload);
      } else {
        await addDoc(collection(db, 'weekly_plans'), payload);
      }
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">اختر الفصل...</option>
            {classesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {WEEKS.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || !selectedClass}>
            <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ الخطة'}
          </button>
        </div>
      </div>
      
      {!selectedClass ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
          يرجى اختيار الفصل من القائمة أعلاه لعرض وتعديل الخطة الأسبوعية.
        </p>
      ) : (
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
      )}
    </div>
  );
}

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch available classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      setClassesList(snap.docs.map(doc => doc.data().name));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !selectedClass) {
      setAssignments([]);
      return;
    }
    
    const q = query(
      collection(db, 'assignments'),
      where('teacherId', '==', auth.currentUser.uid),
      where('className', '==', selectedClass)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setAssignments(data);
    });

    return () => unsubscribe();
  }, [selectedClass]);

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate || !auth.currentUser || !selectedClass) return;
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        title: newTitle,
        dueDate: newDueDate,
        teacherId: auth.currentUser.uid,
        teacherEmail: auth.currentUser.email,
        className: selectedClass,
        createdAt: new Date().toISOString()
      });
      setNewTitle('');
      setNewDueDate('');
    } catch (error) {
      console.error("Error adding assignment:", error);
      alert('حدث خطأ أثناء إضافة الواجب');
    } finally {
      setIsAdding(false);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>إدارة الواجبات</h2>
        <select 
          className="input-field" 
          style={{ width: '200px', marginBottom: 0 }}
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="">اختر الفصل...</option>
          {classesList.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      {!selectedClass ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
          يرجى اختيار الفصل لعرض وإضافة الواجبات.
        </p>
      ) : (
        <>
          <form onSubmit={handleAddAssignment} style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '8px' }}>
            <input 
              type="text" 
              placeholder="عنوان الواجب (مثال: حل تمارين صـ 15)" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              required
            />
            <input 
              type="date" 
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              <Plus size={16} /> إضافة واجب
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {assignments.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>لا توجد واجبات مضافة حالياً.</p>
            ) : (
              assignments.map(assignment => (
                <div key={assignment.id} style={{ 
                  background: 'white', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center', 
                  borderLeft: '4px solid var(--color-primary)'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{assignment.title}</h4>
                    <small style={{ color: 'var(--color-text-muted)' }}>آخر موعد للتسليم: {assignment.dueDate}</small>
                  </div>
                  <button onClick={() => deleteAssignment(assignment.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Attendance() {
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch available classes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      setClassesList(snap.docs.map(doc => doc.data().name));
    });
    return () => unsub();
  }, []);

  // Fetch students for the selected class and any existing attendance for today
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendanceRecords({});
      return;
    }
    
    // Better to use onSnapshot for students
    const sq = query(collection(db, 'students'), where('class', '==', selectedClass));
    const unsubStudents = onSnapshot(sq, (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // And onSnapshot for today's attendance
    const aq = query(
      collection(db, 'attendance'),
      where('className', '==', selectedClass),
      where('date', '==', today)
    );
    const unsubAttendance = onSnapshot(aq, (snap) => {
      if (!snap.empty) {
        setAttendanceRecords(snap.docs[0].data().records || {});
      } else {
        setAttendanceRecords({});
      }
    });

    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, [selectedClass, today]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!auth.currentUser || !selectedClass) return;
    setIsSaving(true);
    try {
      // We check if a doc already exists for today and this class to update or add new
      // We can use a deterministic ID like `${selectedClass}_${today}`
      const docId = `${selectedClass.replace(/\//g, '-')}_${today}`;
      const docRef = doc(db, 'attendance', docId);
      
      await setDoc(docRef, {
        className: selectedClass,
        date: today,
        teacherId: auth.currentUser.uid,
        records: attendanceRecords,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert('تم حفظ سجل الغياب والحضور بنجاح!');
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>سجل الغياب والحضور - اليوم: {today}</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            className="input-field" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">اختر الفصل...</option>
            {classesList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSaveAttendance} disabled={isSaving || !selectedClass}>
            <Save size={18} /> {isSaving ? 'جاري الحفظ...' : 'حفظ السجل'}
          </button>
        </div>
      </div>
      
      {!selectedClass ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
          يرجى اختيار الفصل لعرض قائمة الطلاب وتسجيل الحضور.
        </p>
      ) : students.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>
          لا يوجد طلاب مسجلين في هذا الفصل حالياً.
        </p>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>اسم الطالب</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>حاضر</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>غائب</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>متأخر</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{student.name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name={`status_${student.id}`} 
                      checked={attendanceRecords[student.id] === 'present'}
                      onChange={() => handleStatusChange(student.id, 'present')}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name={`status_${student.id}`} 
                      checked={attendanceRecords[student.id] === 'absent'}
                      onChange={() => handleStatusChange(student.id, 'absent')}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name={`status_${student.id}`} 
                      checked={attendanceRecords[student.id] === 'late'}
                      onChange={() => handleStatusChange(student.id, 'late')}
                      style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



export default function TeacherDashboard() {
  return (
    <Layout role="teacher" title="لوحة تحكم المعلم">
      <Routes>
        <Route path="/" element={<TeacherTasks />} />
        <Route path="/schedule" element={<TeacherSchedule />} />
        <Route path="/weekly-plan" element={<WeeklyPlan />} />
        <Route path="/preparation" element={<LessonPreparation />} />
        <Route path="/materials" element={<MaterialsUpload />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/exams" element={<TeacherExams />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/excellence" element={<TeacherExcellence />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
