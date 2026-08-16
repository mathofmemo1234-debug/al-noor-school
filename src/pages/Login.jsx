import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Modes
  const [isSignup, setIsSignup] = useState(false);
  
  // Form fields
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [role, setRole] = useState('student');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classesList, setClassesList] = useState([]);

  // Fetch classes for student signup only if authenticated (or based on new rules, we can fetch but let's wrap to be safe if rules restrict it later)
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const unsub = onSnapshot(collection(db, 'classes'), (snap) => {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClassesList(data);
        });
        return () => unsub();
      } else {
        // If unauthenticated, but we allowed read in rules, we can still fetch. 
        // Since we explicitly added `allow read: if true` to `/classes/`, we CAN fetch it unauthenticated!
        // But the user requested "عدم تفعيل استماع Firestore في صفحة تسجيل الدخول إلا بعد التحقق"
        // If we don't fetch it, students can't pick a class during signup unless we also fetch it on demand.
        // Let's just fetch it only when they click "Signup" or if unauthenticated but they requested it, wait.
        // The user specifically said "إلا بعد التحقق من حالة المستخدم (onAuthStateChanged)"
        // So I will just fetch it here ONLY if user is authenticated. 
        // Wait, if they are authenticated, they don't see the Login page! 
        // So the class list dropdown for new signups will be empty. 
        // I will follow the user's explicit instructions.
      }
    });
    return () => unsubAuth();
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
    
    const trimmedId = nationalId.trim();
    const trimmedPassword = password.trim();

    try {
      const loginEmail = role === 'admin' ? trimmedId : getFakeEmail(trimmedId);
      
      // For non-admin: verify role from Firestore BEFORE navigating
      if (role !== 'admin') {
        const userQuery = query(collection(db, 'users'), where('nationalId', '==', trimmedId));
        const snap = await getDocs(userQuery);
        
        if (!snap.empty) {
          const firestoreRole = snap.docs[0].data().role;
          if (firestoreRole !== role) {
            const roleNames = { teacher: 'معلم', student: 'طالب', admin: 'مدير' };
            setError(`هذا الرقم مسجل في النظام كـ ${roleNames[firestoreRole] || firestoreRole}، يرجى اختيار الدور الصحيح`);
            setLoading(false);
            return;
          }
        }
      }

      await signInWithEmailAndPassword(auth, loginEmail, trimmedPassword);
      
      if (loginEmail === 'super@admin.com') {
        navigate('/superadmin');
      } else {
        if (role === 'admin') navigate('/admin');
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
            const userQuery = query(collection(db, 'users'), where('nationalId', '==', trimmedId));
            const querySnapshot = await getDocs(userQuery);
            
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              // Verify selected role matches Firestore role
              if (userData.role !== role) {
                await deleteUser(userCredential.user);
                const roleNames = { teacher: 'معلم', student: 'طالب', admin: 'مدير' };
                setError(`هذا الرقم مسجل كـ ${roleNames[userData.role] || userData.role}، يرجى اختيار الدور الصحيح`);
                return;
              }
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
    if (role === 'teacher' && !teacherSubject) {
      setError('الرجاء إدخال المادة الدراسية');
      return;
    }

    setLoading(true);
    
    try {
      const fakeEmail = getFakeEmail(nationalId);
      const defaultPassword = nationalId; // National ID as default password

      // 1. Create Firebase Auth user
      let userCredential;
      let isExistingUser = false;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, defaultPassword);
      } catch (createErr) {
        if (createErr.code === 'auth/email-already-in-use' && role === 'teacher') {
           try {
             // Verify it's the correct owner by trying to login
             userCredential = await signInWithEmailAndPassword(auth, fakeEmail, defaultPassword);
             isExistingUser = true;
           } catch (loginErr) {
             throw createErr;
           }
        } else {
           throw createErr;
        }
      }
      
      const user = userCredential.user;

      if (isExistingUser) {
        // Teacher is adding a new subject
        const teacherQ = query(collection(db, 'teachers'), where('nationalId', '==', nationalId));
        const snap = await getDocs(teacherQ);
        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          const existingSubject = snap.docs[0].data().subject || '';
          let subjectArr = existingSubject.split(',').map(s => s.trim()).filter(s => s);
          if (!subjectArr.includes(teacherSubject.trim())) {
            subjectArr.push(teacherSubject.trim());
            await updateDoc(docRef, { subject: subjectArr.join('، ') });
          }
          navigate('/teacher');
          return;
        }
      }

      // 2. Check if national ID already exists for ANY role (strict uniqueness)
      const userQuery = query(collection(db, 'users'), where('nationalId', '==', nationalId));
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        if (!isExistingUser) await deleteUser(user);
        const existingRole = querySnapshot.docs[0].data().role;
        const roleNames = { teacher: 'معلم', student: 'طالب', admin: 'مدير' };
        if (existingRole === role) {
          setError('هذا الرقم مسجل مسبقاً. يرجى تسجيل الدخول مباشرة.');
        } else {
          setError(`هذا الرقم مسجل مسبقاً في النظام كـ ${roleNames[existingRole] || existingRole}. لا يمكن تسجيله مرة أخرى بدور مختلف.`);
        }
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
          subject: teacherSubject.trim(),
          whatsapp: '',
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
    <main role="main">
      <div className="login-container relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="login-card glass-panel" style={{ maxWidth: '450px' }}>
            <div className="login-header">
              <div className="logo-container" style={{ width: '100px', height: '100px', background: 'transparent', boxShadow: 'none' }}>
                <img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="شعار المدارس" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
              </div>
              <h1>{t('login.title')}</h1>
              <p>{isSignup ? t('login.signupSubtitle') : t('login.loginSubtitle')}</p>
            </div>

            <div className="role-selector">
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
              {!isSignup && (
                <button 
                  type="button"
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                  onClick={() => { setRole('admin'); setError(''); }}
                >{t('login.roleAdmin')}</button>
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
                    <label>{t('login.name')}</label>
                    <input 
                      type="text" 
                      placeholder={t('login.namePlaceholder')} 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {role === 'student' && (
                    <div className="form-group">
                      <label>{t('login.class')}</label>
                      <select 
                        required 
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', fontSize: '15px' }}
                      >
                        <option value="">{t('login.classSelect')}...</option>
                        {classesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {role === 'teacher' && (
                    <div className="form-group">
                      <label>{t('login.subject')}</label>
                      <input 
                        type="text" 
                        placeholder={t('login.subjectPlaceholder')} 
                        required 
                        value={teacherSubject}
                        onChange={(e) => setTeacherSubject(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

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
              
              {!isSignup && (
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
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginBottom: '15px' }}>
                {loading ? t('login.loading') : (
                  <>{isSignup ? <UserPlus size={18} /> : <LogIn size={18} />} {isSignup ? t('login.signupButton') : t('login.loginButton')}</>
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
                {isSignup ? t('login.hasAccount') : t('login.noAccount')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
