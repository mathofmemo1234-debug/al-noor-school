import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser, signInWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
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

  // Google Login & Parent Student Link Modal State
  const [googleUser, setGoogleUser] = useState(null);
  const [showStudentLinkModal, setShowStudentLinkModal] = useState(false);
  const [studentNationalIdInput, setStudentNationalIdInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

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

    const trimmedIdOrEmail = nationalId.trim();
    const trimmedPassword = password.trim();
    const trimmedStudentId = parentStudentId.trim();

    if (!trimmedIdOrEmail || !trimmedPassword || !trimmedStudentId) {
      setError('يرجى ملء كافة البيانات بما فيها رقم هوية الطالب المسجل.');
      setLoading(false);
      return;
    }

    try {
      // 1. Verify student exists in system
      let sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', trimmedStudentId)));
      let studentDoc = null;
      if (!sSnap.empty) {
        studentDoc = sSnap.docs[0].data();
      } else {
        const uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', trimmedStudentId)));
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

      const email = getFakeEmail(trimmedIdOrEmail);
      // 2. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, trimmedPassword);
      const user = userCredential.user;

      const parentRecord = {
        uid: user.uid,
        email: email,
        nationalId: trimmedIdOrEmail,
        name: parentName.trim() || 'ولي أمر',
        role: 'parent',
        studentNationalId: trimmedStudentId,
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user is already registered as a parent
      let q = query(collection(db, 'users'), where('email', '==', user.email));
      let snap = await getDocs(q);
      if (snap.empty && user.uid) {
        q = query(collection(db, 'users'), where('uid', '==', user.uid));
        snap = await getDocs(q);
      }

      let pData = null;
      if (!snap.empty) {
        pData = snap.docs.find(d => d.data().role === 'parent')?.data() || snap.docs[0].data();
      }

      if (!pData || pData.role !== 'parent') {
        const pSnap = await getDocs(query(collection(db, 'parents'), where('email', '==', user.email)));
        if (!pSnap.empty) {
          pData = pSnap.docs[0].data();
        }
      }

      if (pData && pData.studentNationalId) {
        setLoginRole('parent');
        navigate('/parent');
      } else {
        setGoogleUser(user);
        setShowStudentLinkModal(true);
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة تسجيل الدخول.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة أو استخدام التسجيل المباشر.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('النطاق المحلي/الحالي غير مصرح له في Firebase Google Auth. يمكنك استخدام التسجيل المباشر برقم الهوية والكلمة السرية.');
      } else {
        setError('تعذر تسجيل الدخول عبر Google. يمكنك استخدام نموذج التسجيل/الدخول المباشر أدناه.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkLoading(true);

    const sNid = studentNationalIdInput.trim();
    if (!sNid) {
      setLinkError('يرجى إدخال رقم هوية الطالب');
      setLinkLoading(false);
      return;
    }

    try {
      // Find student in students collection
      let sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', sNid)));
      let studentDoc = null;
      if (!sSnap.empty) {
        studentDoc = sSnap.docs[0].data();
      } else {
        // Fallback: check users collection for student
        const uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', sNid)));
        if (!uSnap.empty) {
          const uDoc = uSnap.docs.map(d => d.data()).find(d => d.role === 'student');
          if (uDoc) studentDoc = uDoc;
        }
      }

      if (!studentDoc) {
        setLinkError(t('login.studentNotFound'));
        setLinkLoading(false);
        return;
      }

      // Link parent account with student details
      const parentRecord = {
        uid: googleUser?.uid || '',
        email: googleUser?.email || '',
        name: googleUser?.displayName || 'ولي أمر',
        role: 'parent',
        studentNationalId: sNid,
        studentName: studentDoc.name || 'طالب',
        studentClass: studentDoc.class || studentDoc.className || '',
        schoolId: studentDoc.schoolId || 'default_school_1',
        createdAt: new Date()
      };

      // Add to users collection
      await addDoc(collection(db, 'users'), parentRecord);
      
      // Add to parents collection
      await addDoc(collection(db, 'parents'), parentRecord);

      setShowStudentLinkModal(false);
      setLoginRole('parent');
      navigate('/parent');
    } catch (err) {
      console.error("Link Student Error:", err);
      setLinkError('حدث خطأ أثناء ربط حساب الطالب. يرجى المحاولة لاحقاً.');
    } finally {
      setLinkLoading(false);
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
                <button 
                  type="button" 
                  className="btn btn-google btn-block" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{ 
                    background: '#ffffff', 
                    color: '#3c4043', 
                    border: '1px solid #dadce0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    fontSize: '14px',
                    cursor: 'pointer', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    width: '100%',
                    marginBottom: '18px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  {isSignup ? 'إنشاء حساب عبر Google' : t('login.googleSignIn')}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{t('login.orDivider')}</span>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>

                {!isSignup ? (
                  /* PARENT DIRECT LOGIN FORM */
                  <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>{t('login.nationalId')}</label>
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
                      <label>{t('login.nationalId')}</label>
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
                      <label>{t('login.password')}</label>
                      <input 
                        type="password" 
                        placeholder={t('login.passwordPlaceholder')} 
                        required 
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

      {/* Student Verification & Linking Modal */}
      {showStudentLinkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', background: 'var(--color-bg-card, #ffffff)', padding: '28px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-text)' }}>
              {t('login.linkStudentButton')}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: '1.6' }}>
              {t('login.enterStudentIdPrompt')}
            </p>

            {linkError && (
              <div className="error-message" style={{ marginBottom: '15px' }}>
                <AlertCircle size={16} />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleLinkStudent}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                  رقم هوية/إقامة الطالب المسجل
                </label>
                <input 
                  type="text"
                  required
                  dir="ltr"
                  placeholder={t('login.studentIdPlaceholder')}
                  value={studentNationalIdInput}
                  onChange={(e) => setStudentNationalIdInput(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn"
                  onClick={() => { setShowStudentLinkModal(false); setLinkError(''); }}
                  disabled={linkLoading}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={linkLoading}
                  style={{ padding: '10px 22px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  {linkLoading ? t('login.loading') : t('login.linkStudentButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
