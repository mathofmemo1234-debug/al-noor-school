import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  
  // Modes
  const [isSignup, setIsSignup] = useState(false);
  
  // Form fields
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [role, setRole] = useState('student');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classesList, setClassesList] = useState([]);

  // Fetch classes for student signup
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClassesList(data);
    });
    return () => unsub();
  }, []);

  const getFakeEmail = (id) => {
    // Basic validation to ensure it's not already an email (like admin email)
    if (id.includes('@')) return id;
    return `${id}@school.local`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const loginEmail = role === 'admin' ? nationalId : getFakeEmail(nationalId);
      await signInWithEmailAndPassword(auth, loginEmail, password);
      
      if (role === 'admin') navigate('/admin');
      if (role === 'teacher') navigate('/teacher');
      if (role === 'student') navigate('/student');
    } catch (err) {
      console.error("Login Error:", err);
      
      if (role !== 'admin' && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password')) {
        if (password === nationalId) {
          const fakeEmail = getFakeEmail(nationalId);
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
            const userQuery = query(collection(db, 'users'), where('nationalId', '==', nationalId));
            const querySnapshot = await getDocs(userQuery);
            
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              if (userData.role === 'teacher') navigate('/teacher');
              if (userData.role === 'student') navigate('/student');
              return;
            } else {
              await deleteUser(userCredential.user);
              setError('رقم الهوية غير مسجل في النظام. يرجى مراجعة الإدارة.');
            }
          } catch (createErr) {
            console.error("Create Error:", createErr);
            setError('رقم الهوية أو كلمة المرور غير صحيحة');
          }
        } else {
          setError('رقم الهوية أو كلمة المرور غير صحيحة');
        }
      } else {
        setError('رقم الهوية أو كلمة المرور غير صحيحة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || name.split(' ').length < 3) {
      setError('الرجاء كتابة الاسم الرباعي (أو الثلاثي على الأقل)');
      return;
    }
    if (!nationalId || nationalId.length < 10) {
      setError('الرجاء إدخال رقم هوية صحيح (10 أرقام على الأقل)');
      return;
    }
    if (role === 'student' && !studentClass) {
      setError('الرجاء اختيار الفصل الدراسي');
      return;
    }

    setLoading(true);
    
    try {
      const fakeEmail = getFakeEmail(nationalId);
      const defaultPassword = nationalId; // National ID as default password

      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, defaultPassword);
      const user = userCredential.user;

      // 2. Check if user already exists in Firestore (added by admin)
      const userQuery = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        await deleteUser(user);
        setError('هذا الحساب مضاف مسبقاً من الإدارة، الرجاء تسجيل الدخول مباشرة');
        return;
      }

      // 3. Add to 'users' collection for RBAC
      await addDoc(collection(db, 'users'), {
        nationalId: nationalId,
        email: fakeEmail,
        role: role,
        name: name
      });

      // 4. Add to specific role collection
      if (role === 'student') {
        await addDoc(collection(db, 'students'), {
          nationalId: nationalId,
          email: fakeEmail,
          name: name,
          class: studentClass,
          role: 'student',
          createdAt: new Date()
        });
        navigate('/student');
      } else if (role === 'teacher') {
        await addDoc(collection(db, 'teachers'), {
          nationalId: nationalId,
          email: fakeEmail,
          name: name,
          subject: '',
          role: 'teacher',
          createdAt: new Date()
        });
        navigate('/teacher');
      }
    } catch (err) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
         setError('رقم الهوية مسجل مسبقاً في النظام');
      } else {
         setError('حدث خطأ أثناء إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel" style={{ maxWidth: '450px' }}>
        <div className="login-header">
          <div className="logo-container" style={{ width: '100px', height: '100px', background: 'transparent', boxShadow: 'none' }}>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <path d="M100 20 L40 140 H70 L100 80 L130 140 H160 Z" fill="#63B2C6" />
              <path d="M50 110 Q100 80 150 110 L140 130 Q100 100 60 130 Z" fill="#B4D396" />
              <text x="100" y="155" fontFamily="Arial" fontSize="12" fill="#B4D396" textAnchor="middle" fontWeight="bold">1995 - 1416</text>
            </svg>
          </div>
          <h1>المدارس المتقدمة للتعلم الذكي</h1>
          <p>{isSignup ? 'إنشاء حساب جديد' : 'بوابة الدخول الموحدة'}</p>
        </div>

        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(''); }}
          >طالب</button>
          <button 
            type="button"
            className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRole('teacher'); setError(''); }}
          >معلم</button>
          {!isSignup && (
            <button 
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setError(''); }}
            >إدارة</button>
          )}
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '15px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <>
              <div className="form-group">
                <label>الاسم الرباعي</label>
                <input 
                  type="text" 
                  placeholder="الاسم كاملًا" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {role === 'student' && (
                <div className="form-group">
                  <label>الفصل الدراسي</label>
                  <select 
                    required 
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', fontSize: '15px' }}
                  >
                    <option value="">اختر الفصل...</option>
                    {classesList.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>{role === 'admin' ? 'البريد الإلكتروني للإدارة' : 'رقم الهوية الوطنية'}</label>
            <input 
              type={role === 'admin' ? 'email' : 'text'} 
              placeholder={role === 'admin' ? 'admin@school.com' : '10xxxxxxxx'} 
              required 
              dir="ltr"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
            />
          </div>
          
          {!isSignup && (
            <div className="form-group">
              <label>كلمة المرور {role !== 'admin' && <span style={{fontSize:'12px', color:'#666'}}>(الافتراضية هي رقم الهوية)</span>}</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginBottom: '15px' }}>
            {loading ? 'جاري التحقق...' : (
              <>{isSignup ? <UserPlus size={18} /> : <LogIn size={18} />} {isSignup ? 'إنشاء حساب' : 'تسجيل الدخول'}</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              if (role === 'admin') setRole('student');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary-dark)', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
          >
            {isSignup ? 'لديك حساب بالفعل؟ قم بتسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}
