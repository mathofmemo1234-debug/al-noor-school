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

  // Parent Direct Signup State
  const [isSignup, setIsSignup] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentStudentId, setParentStudentId] = useState('');

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

    // Helper to find record across users, teachers, students, parents
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

      // 2. Check parents if requested role is parent
      if (desiredRole === 'parent') {
        try {
          const pSnap = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', nid)));
          if (!pSnap.empty) {
            return { ...pSnap.docs[0].data(), role: 'parent' };
          }
        } catch (err) {
          console.warn("Error querying parents collection:", err);
        }
      }

      // 3. Check teachers if requested role is teacher
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

      // 4. Check staff if requested role is staff or supervisor
      if (desiredRole === 'staff' || desiredRole === 'supervisor') {
        try {
          const staffSnap = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', nid)));
          if (!staffSnap.empty) {
            return { ...staffSnap.docs[0].data(), role: 'staff' };
          }
          const supSnap = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', nid)));
          if (!supSnap.empty) {
            return { ...supSnap.docs[0].data(), role: 'supervisor' };
          }
        } catch (err) {
          console.warn("Error querying staff/supervisors collection:", err);
        }
      }

      // 5. Check students if requested role is student
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

      // 6. General check across other collections to detect wrong role choice
      try {
        const pSnapAll = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', nid)));
        if (!pSnapAll.empty) {
          return { ...pSnapAll.docs[0].data(), role: 'parent' };
        }
        const tSnapAll = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', nid)));
        if (!tSnapAll.empty) {
          return { ...tSnapAll.docs[0].data(), role: 'teacher' };
        }
        const staffSnapAll = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', nid)));
        if (!staffSnapAll.empty) {
          return { ...staffSnapAll.docs[0].data(), role: 'staff' };
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
        if (record && record.role !== role && !(role === 'staff' && (record.role === 'supervisor' || record.role === 'staff'))) {
          await auth.signOut();
          const roleNames = { parent: 'ولي أمر', teacher: 'معلم', student: 'طالب', staff: 'كادر إداري / وكيل', supervisor: 'مشرف تعليمي', admin: 'مدير' };
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
        if (role === 'staff') navigate('/staff');
        if (role === 'supervisor') navigate('/supervisor');
        if (role === 'teacher') navigate('/teacher');
        if (role === 'student') navigate('/student');
        if (role === 'parent') navigate('/parent');
      }
    } catch (err) {
      console.error("Login Error:", err);
      
      if (role !== 'admin' && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email')) {
        if (trimmedPassword === trimmedId) {
          const fakeEmail = getFakeEmail(trimmedId);
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, trimmedPassword);
            
            const record = await findRecord(trimmedId, role);
            
            if (record) {
              if (record.role !== role && !(role === 'staff' && (record.role === 'supervisor' || record.role === 'staff'))) {
                await deleteUser(userCredential.user);
                const roleNames = { parent: 'ولي أمر', teacher: 'معلم', student: 'طالب', staff: 'كادر إداري / وكيل', supervisor: 'مشرف تعليمي', admin: 'مدير' };
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
                    name: record.name || 'مستخدم',
                    schoolId: record.schoolId || 'default_school_1'
                  });
                }
              } catch (syncErr) {
                console.warn("Could not sync to users:", syncErr);
              }

              setLoginRole(record.role);
              if (record.role === 'staff') { navigate('/staff'); }
              if (record.role === 'supervisor') { navigate('/supervisor'); }
              if (record.role === 'teacher') { navigate('/teacher'); }
              if (record.role === 'student') { navigate('/student'); }
              if (record.role === 'parent') { navigate('/parent'); }
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

  const handleParentDirectSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedParentNid = nationalId.trim();
    const trimmedStudentNid = parentStudentId.trim();
    const trimmedPassword = password.trim() || trimmedParentNid;

    if (!trimmedParentNid || !trimmedStudentNid) {
      setError('يرجى إدخال رقم هوية ولي الأمر ورقم هوية الطالب المسجل.');
      setLoading(false);
      return;
    }

    try {
      // 1. Verify student exists in system
      let sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', trimmedStudentNid)));
      let studentDoc = null;
      if (!sSnap.empty) {
        studentDoc = sSnap.docs[0].data();
      } else {
        const uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', trimmedStudentNid)));
        if (!uSnap.empty) {
          const uMatch = uSnap.docs.map(d => d.data()).find(d => d.role === 'student');
          if (uMatch) studentDoc = uMatch;
        }
      }

      if (!studentDoc) {
        setError(t('login.studentNotFound'));
        setLoading(false);
        return;
      }

      const email = getFakeEmail(trimmedParentNid);
      // 2. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, trimmedPassword);
      const user = userCredential.user;

      const parentRecord = {
        uid: user.uid,
        email: email,
        nationalId: trimmedParentNid,
        name: parentName.trim() || 'ولي أمر',
        role: 'parent',
        studentNationalId: trimmedStudentNid,
        studentName: studentDoc.name || 'طالب',
        studentClass: studentDoc.class || studentDoc.className || '',
        schoolId: studentDoc.schoolId || 'default_school_1',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'users'), parentRecord);
      await addDoc(collection(db, 'parents'), parentRecord);

      setLoginRole('parent');
      navigate('/parent');
    } catch (createErr) {
      console.error("Parent Signup Error:", createErr);
      if (createErr.code === 'auth/email-already-in-use') {
        setError('هذا الحساب أو رقم الهوية مسجل مسبقاً. يمكنك التبديل لتبويب تسجيل الدخول.');
      } else {
        setError('حدث خطأ أثناء إنشاء حساب ولي الأمر. يرجى التأكد من البيانات والمحاولة لاحقاً.');
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
          <div className="login-card glass-panel" style={{ maxWidth: '480px' }}>
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

            <div className="role-selector" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '20px' }}>
              <button 
                type="button"
                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => { setRole('student'); setError(''); }}
                style={{ padding: '8px 2px', fontSize: '12px' }}
              >{t('login.roleStudent')}</button>
              <button 
                type="button"
                className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => { setRole('teacher'); setError(''); }}
                style={{ padding: '8px 2px', fontSize: '12px' }}
              >{t('login.roleTeacher')}</button>
              <button 
                type="button"
                className={`role-btn ${role === 'parent' ? 'active' : ''}`}
                onClick={() => { setRole('parent'); setError(''); }}
                style={{ padding: '8px 2px', fontSize: '12px' }}
              >{t('login.roleParent')}</button>
              <button 
                type="button"
                className={`role-btn ${(role === 'staff' || role === 'supervisor') ? 'active' : ''}`}
                onClick={() => { setRole('staff'); setError(''); }}
                style={{ fontSize: '11px', padding: '8px 2px' }}
              >وكيل / كادر</button>
              <button 
                type="button"
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => { setRole('admin'); setError(''); }}
                style={{ padding: '8px 2px', fontSize: '12px' }}
              >{t('login.roleAdmin')}</button>
            </div>

            {/* Login / Register Toggle Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setIsSignup(false); setError(''); }}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: !isSignup ? '3px solid #2563eb' : '3px solid transparent', 
                  fontWeight: !isSignup ? 'bold' : 'normal',
                  color: !isSignup ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {t('login.loginNow')}
              </button>
              <button 
                type="button" 
                onClick={() => { setIsSignup(true); setError(''); }}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  background: 'none', 
                  border: 'none', 
                  borderBottom: isSignup ? '3px solid #2563eb' : '3px solid transparent', 
                  fontWeight: isSignup ? 'bold' : 'normal',
                  color: isSignup ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {t('login.createAccount')}
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ marginBottom: '15px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* PARENT ROLE VIEW */}
            {role === 'parent' ? (
              <div style={{ marginTop: '5px' }}>
                {!isSignup ? (
                  /* PARENT DIRECT LOGIN FORM */
                  <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>رقم هوية ولي الأمر</label>
                      <input 
                        type="text" 
                        placeholder={t('login.nationalIdPlaceholder')} 
                        required 
                        dir="ltr"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>{t('login.password')} <span style={{fontSize:'12px', color:'#666'}}>(الافتراضية هي رقم الهوية)</span></label>
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
                ) : (
                  /* PARENT DIRECT SIGNUP FORM */
                  <form className="login-form" onSubmit={handleParentDirectSignup}>
                    <div className="form-group">
                      <label>رقم هوية ولي الأمر</label>
                      <input 
                        type="text" 
                        placeholder={t('login.nationalIdPlaceholder')} 
                        required 
                        dir="ltr"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('login.parentName')}</label>
                      <input 
                        type="text" 
                        placeholder={t('login.parentNamePlaceholder')} 
                        required 
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ color: '#2563eb', fontWeight: 'bold' }}>رقم هوية/إقامة الطالب المسجل بالنظام</label>
                      <input 
                        type="text" 
                        placeholder={t('login.studentIdPlaceholder')} 
                        required 
                        dir="ltr"
                        value={parentStudentId}
                        onChange={(e) => setParentStudentId(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('login.password')} <span style={{fontSize:'12px', color:'#666'}}>(تترك فارغة لتعيين رقم الهوية ككلمة مرور)</span></label>
                      <input 
                        type="password" 
                        placeholder="كلمة المرور (الافتراضية رقم الهوية)" 
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginBottom: '15px' }}>
                      {loading ? t('login.loading') : t('login.parentDirectSignupButton')}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* NON-PARENT ROLES FORM */
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
