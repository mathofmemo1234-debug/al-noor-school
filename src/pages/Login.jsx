import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setLoginRole } = useAuth();
  
  // Form fields
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getFakeEmail = (id) => {
    if (id.includes('@')) return id;
    return `${id}@school.local`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const trimmedId = nationalId.trim();
    const trimmedPassword = password.trim();

    // Helper to find record across users, teachers, students
    const findRecord = async (nid, desiredRole) => {
      // 1. Check users
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', nid)));
        if (!uSnap.empty) {
          const docs = uSnap.docs.map(d => d.data());
          const match = docs.find(d => d.role === desiredRole);
          if (match) return match;
          return docs[0];
        }
      } catch (err) {
        console.warn("Error querying users collection:", err);
      }

      // 2. Check teachers if requested role is teacher
      if (desiredRole === 'teacher') {
        try {
          const tSnap = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', nid)));
          if (!tSnap.empty) {
            return { ...tSnap.docs[0].data(), role: 'teacher' };
          }
        } catch (err) {
          console.warn("Error querying teachers collection:", err);
        }
      }

      // 3. Check supervisors if requested role is supervisor
      if (desiredRole === 'supervisor') {
        try {
          const supSnap = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', nid)));
          if (!supSnap.empty) {
            return { ...supSnap.docs[0].data(), role: 'supervisor' };
          }
        } catch (err) {
          console.warn("Error querying supervisors collection:", err);
        }
      }

      // 4. Check students if requested role is student
      if (desiredRole === 'student') {
        try {
          const sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', nid)));
          if (!sSnap.empty) {
            return { ...sSnap.docs[0].data(), role: 'student' };
          }
        } catch (err) {
          console.warn("Error querying students collection:", err);
        }
      }

      // 5. General check across other collections to detect wrong role choice
      try {
        const tSnapAll = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', nid)));
        if (!tSnapAll.empty) {
          return { ...tSnapAll.docs[0].data(), role: 'teacher' };
        }
        const supSnapAll = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', nid)));
        if (!supSnapAll.empty) {
          return { ...supSnapAll.docs[0].data(), role: 'supervisor' };
        }
        const sSnapAll = await getDocs(query(collection(db, 'students'), where('nationalId', '==', nid)));
        if (!sSnapAll.empty) {
          return { ...sSnapAll.docs[0].data(), role: 'student' };
        }
      } catch (err) {
        console.warn("General collection check error:", err);
      }

      return null;
    };

    try {
      const loginEmail = role === 'admin' ? trimmedId : getFakeEmail(trimmedId);
      
      // Step 1: Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, loginEmail, trimmedPassword);
      
      // Step 2: Now that we are authenticated, verify the user's role in Firestore
      if (role !== 'admin') {
        const record = await findRecord(trimmedId, role);
        if (record && record.role !== role) {
          await auth.signOut();
          const roleNames = { teacher: 'معلم', student: 'طالب', supervisor: 'مشرف تعليمي', admin: 'مدير' };
          setError(`هذا الرقم مسجل في النظام كـ ${roleNames[record.role] || record.role}، يرجى اختيار الدور الصحيح`);
          setLoading(false);
          return;
        }
      }

      setLoginRole(role);
      
      if (loginEmail === 'super@admin.com') {
        navigate('/superadmin');
      } else {
        if (role === 'admin') navigate('/admin');
        if (role === 'supervisor') navigate('/supervisor');
        if (role === 'teacher') navigate('/teacher');
        if (role === 'student') navigate('/student');
      }
    } catch (err) {
      console.error("Login Error:", err);
      
      if (role !== 'admin' && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email')) {
        if (trimmedPassword === trimmedId) {
          const fakeEmail = getFakeEmail(trimmedId);
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, trimmedPassword);
            
            // Search across users, supervisors, teachers, and students collections
            const record = await findRecord(trimmedId, role);
            
            if (record) {
              if (record.role !== role) {
                await deleteUser(userCredential.user);
                const roleNames = { teacher: 'معلم', student: 'طالب', supervisor: 'مشرف تعليمي', admin: 'مدير' };
                setError(`هذا الرقم مسجل في النظام كـ ${roleNames[record.role] || record.role}، يرجى اختيار الدور الصحيح`);
                return;
              }

              // Auto sync to users collection if missing
              try {
                const uCheck = await getDocs(query(collection(db, 'users'), where('nationalId', '==', trimmedId)));
                if (uCheck.empty) {
                  await addDoc(collection(db, 'users'), {
                    nationalId: trimmedId,
                    email: fakeEmail,
                    role: record.role,
                    name: record.name || (record.role === 'supervisor' ? 'مشرف تعليمي' : record.role === 'teacher' ? 'معلم' : 'طالب'),
                    specialty: record.specialty || '',
                    schoolId: record.schoolId || 'default_school_1'
                  });
                }
              } catch (syncErr) {
                console.warn("Could not sync to users:", syncErr);
              }

              setLoginRole(record.role);
              if (record.role === 'supervisor') { navigate('/supervisor'); }
              if (record.role === 'teacher') { navigate('/teacher'); }
              if (record.role === 'student') { navigate('/student'); }
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

  return (
    <main role="main">
      <div className="login-container relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="login-card glass-panel" style={{ maxWidth: '450px' }}>
            <div className="login-header">
              <div className="logo-container" style={{ width: '100px', height: '100px', background: 'transparent', boxShadow: 'none' }}>
                <img 
                  src={`${import.meta.env.BASE_URL}logo.webp`} 
                  alt="شعار المدارس" 
                  width="100"
                  height="100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${import.meta.env.BASE_URL}default_logo.png`;
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} 
                />
              </div>
              <h1>{t('login.title')}</h1>
              <p>{t('login.loginSubtitle')}</p>
            </div>

            <div className="role-selector" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <button 
                type="button"
                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => { setRole('student'); setError(''); }}
              >{t('login.roleStudent')}</button>
              <button 
                type="button"
                className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => { setRole('teacher'); setError(''); }}
              >{t('login.roleTeacher')}</button>
              <button 
                type="button"
                className={`role-btn ${role === 'supervisor' ? 'active' : ''}`}
                onClick={() => { setRole('supervisor'); setError(''); }}
              >مشرف تعليمي</button>
              <button 
                type="button"
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => { setRole('admin'); setError(''); }}
              >{t('login.roleAdmin')}</button>
            </div>

            {error && (
              <div className="error-message" style={{ marginBottom: '15px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>{role === 'admin' ? 'البريد الإلكتروني للإدارة' : t('login.nationalId')}</label>
                <input 
                  type={role === 'admin' ? 'email' : 'text'} 
                  placeholder={role === 'admin' ? 'admin@school.com' : t('login.nationalIdPlaceholder')} 
                  required 
                  dir="ltr"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>{t('login.password')} {role !== 'admin' && <span style={{fontSize:'12px', color:'#666'}}>(الافتراضية هي رقم الهوية)</span>}</label>
                <input 
                  type="password" 
                  placeholder={t('login.passwordPlaceholder')} 
                  required 
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginBottom: '15px' }}>
                {loading ? t('login.loading') : (
                  <><LogIn size={18} /> {t('login.loginButton')}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
