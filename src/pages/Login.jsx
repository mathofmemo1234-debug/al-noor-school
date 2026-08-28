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
  const { currentUser, userRole, loading: authLoading, setLoginRole } = useAuth();
  
  // Auto-redirect already authenticated users
  React.useEffect(() => {
    if (!authLoading && currentUser && userRole) {
      navigate(`/${userRole}`, { replace: true });
    }
  }, [authLoading, currentUser, userRole, navigate]);
  
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
    
    const trimmedId = nationalId.trim().replace(/\s+/g, '');
    const trimmedPassword = password.trim();

    // Helper to find record across users, teachers, students, parents
    const findRecord = async (nid, desiredRole) => {
      // 1. Check users
      try {
        let uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', nid)));
        if (uSnap.empty && !isNaN(nid)) {
          uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', Number(nid))));
        }
        if (uSnap.empty) {
          uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', getFakeEmail(nid))));
        }
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
          let pSnap = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', nid)));
          if (pSnap.empty && !isNaN(nid)) {
            pSnap = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', Number(nid))));
          }
          if (pSnap.empty) {
            pSnap = await getDocs(query(collection(db, 'parents'), where('email', '==', getFakeEmail(nid))));
          }
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
          let tSnap = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', nid)));
          if (tSnap.empty && !isNaN(nid)) {
            tSnap = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', Number(nid))));
          }
          if (tSnap.empty) {
            tSnap = await getDocs(query(collection(db, 'teachers'), where('email', '==', getFakeEmail(nid))));
          }
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
          let staffSnap = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', nid)));
          if (staffSnap.empty && !isNaN(nid)) {
            staffSnap = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', Number(nid))));
          }
          if (staffSnap.empty) {
            staffSnap = await getDocs(query(collection(db, 'staff'), where('email', '==', getFakeEmail(nid))));
          }
          if (!staffSnap.empty) {
            return { ...staffSnap.docs[0].data(), role: 'staff' };
          }
          let supSnap = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', nid)));
          if (supSnap.empty && !isNaN(nid)) {
            supSnap = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', Number(nid))));
          }
          if (supSnap.empty) {
            supSnap = await getDocs(query(collection(db, 'supervisors'), where('email', '==', getFakeEmail(nid))));
          }
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
          let sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', nid)));
          if (sSnap.empty && !isNaN(nid)) {
            sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', Number(nid))));
          }
          if (sSnap.empty) {
            sSnap = await getDocs(query(collection(db, 'students'), where('email', '==', getFakeEmail(nid))));
          }
          if (!sSnap.empty) {
            return { ...sSnap.docs[0].data(), role: 'student' };
          }
        } catch (err) {
          console.warn("Error querying students collection:", err);
        }
      }

      // 6. General check across other collections to detect wrong role choice
      try {
        let pSnapAll = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', nid)));
        if (pSnapAll.empty && !isNaN(nid)) pSnapAll = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', Number(nid))));
        if (!pSnapAll.empty) return { ...pSnapAll.docs[0].data(), role: 'parent' };

        let tSnapAll = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', nid)));
        if (tSnapAll.empty && !isNaN(nid)) tSnapAll = await getDocs(query(collection(db, 'teachers'), where('nationalId', '==', Number(nid))));
        if (!tSnapAll.empty) return { ...tSnapAll.docs[0].data(), role: 'teacher' };

        let staffSnapAll = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', nid)));
        if (staffSnapAll.empty && !isNaN(nid)) staffSnapAll = await getDocs(query(collection(db, 'staff'), where('nationalId', '==', Number(nid))));
        if (!staffSnapAll.empty) return { ...staffSnapAll.docs[0].data(), role: 'staff' };

        let supSnapAll = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', nid)));
        if (supSnapAll.empty && !isNaN(nid)) supSnapAll = await getDocs(query(collection(db, 'supervisors'), where('nationalId', '==', Number(nid))));
        if (!supSnapAll.empty) return { ...supSnapAll.docs[0].data(), role: 'supervisor' };

        let sSnapAll = await getDocs(query(collection(db, 'students'), where('nationalId', '==', nid)));
        if (sSnapAll.empty && !isNaN(nid)) sSnapAll = await getDocs(query(collection(db, 'students'), where('nationalId', '==', Number(nid))));
        if (!sSnapAll.empty) return { ...sSnapAll.docs[0].data(), role: 'student' };
      } catch (err) {
        console.warn("General collection check error:", err);
      }

      return null;
    };

    try {
      const loginEmail = getFakeEmail(trimmedId);
      
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
        if (trimmedPassword === trimmedId || role === 'parent') {
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
            } else if (role === 'parent') {
              // Parent record exists in parents/users or newly created
              setLoginRole('parent');
              navigate('/parent');
              return;
            } else {
              await deleteUser(userCredential.user);
              setError('رقم الهوية غير مسجل في النظام. يرجى مراجعة الإدارة.');
            }
          } catch (createErr) {
            console.error("Create Error:", createErr);
            const record = await findRecord(trimmedId, role);
            if (record || role === 'parent') {
              setLoginRole(role);
              navigate(role === 'parent' ? '/parent' : `/${role}`);
              return;
            }
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

    const trimmedParentNid = nationalId.trim().replace(/\s+/g, '');
    const trimmedStudentNid = parentStudentId.trim().replace(/\s+/g, '');
    let trimmedPassword = password.trim();
    if (!trimmedPassword) {
      trimmedPassword = trimmedParentNid;
    }

    if (!trimmedParentNid || !trimmedStudentNid) {
      setError('يرجى إدخال رقم هوية ولي الأمر ورقم هوية الطالب المسجل.');
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أرقام/خانات.');
      setLoading(false);
      return;
    }

    try {
      // 1. Verify student exists in system (check string and number across collections)
      let studentDoc = null;
      
      // A. Query students collection with string & number
      try {
        let sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', trimmedStudentNid)));
        if (sSnap.empty && !isNaN(trimmedStudentNid)) {
          sSnap = await getDocs(query(collection(db, 'students'), where('nationalId', '==', Number(trimmedStudentNid))));
        }
        if (!sSnap.empty) {
          studentDoc = sSnap.docs[0].data();
        }
      } catch (sErr) {
        console.warn("Students query warning:", sErr);
      }

      // B. Query users collection for student
      if (!studentDoc) {
        try {
          let uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', trimmedStudentNid)));
          if (uSnap.empty && !isNaN(trimmedStudentNid)) {
            uSnap = await getDocs(query(collection(db, 'users'), where('nationalId', '==', Number(trimmedStudentNid))));
          }
          if (!uSnap.empty) {
            const uMatch = uSnap.docs.map(d => d.data()).find(d => d.role === 'student');
            if (uMatch) studentDoc = uMatch;
          }
        } catch (uErr) {
          console.warn("Users query warning:", uErr);
        }
      }

      // C. Full scan fallback across students collection
      if (!studentDoc) {
        try {
          const allStudentsSnap = await getDocs(collection(db, 'students'));
          if (!allStudentsSnap.empty) {
            const match = allStudentsSnap.docs.map(d => d.data()).find(d => 
              String(d.nationalId || d.id || d.studentId || d.civilId || '').trim() === trimmedStudentNid
            );
            if (match) studentDoc = match;
          }
        } catch (scanErr) {
          console.warn("Students full scan warning:", scanErr);
        }
      }

      // D. Fallback if student doc is still not found in DB: create fallback student details
      if (!studentDoc) {
        studentDoc = {
          nationalId: trimmedStudentNid,
          name: `طالب (${trimmedStudentNid})`,
          class: '',
          schoolId: 'default_school_1'
        };
      }

      const email = getFakeEmail(trimmedParentNid);
      let user = null;

      // 2. Try creating Firebase Auth user or sign in if already exists
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, trimmedPassword);
        user = userCredential.user;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, trimmedPassword);
            user = userCredential.user;
          } catch (signInErr) {
            try {
              const userCredential = await signInWithEmailAndPassword(auth, email, trimmedParentNid);
              user = userCredential.user;
            } catch (fallbackErr) {
              console.warn("Auth fallback signin warning:", fallbackErr);
            }
          }
        } else if (authErr.code === 'auth/weak-password') {
          setError('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور من 6 أرقام/خانات على الأقل.');
          setLoading(false);
          return;
        } else {
          console.warn("Auth creation warning:", authErr);
        }
      }

      // 3. Prepare parent record
      const parentRecord = {
        uid: user ? user.uid : '',
        email: email,
        nationalId: trimmedParentNid,
        name: parentName.trim() || 'ولي أمر',
        role: 'parent',
        studentNationalId: trimmedStudentNid,
        studentName: studentDoc.name || `طالب (${trimmedStudentNid})`,
        studentClass: studentDoc.class || studentDoc.className || '',
        schoolId: studentDoc.schoolId || 'default_school_1',
        createdAt: new Date()
      };

      // 4. Save/Update record in users and parents collections
      try {
        const uExist = await getDocs(query(collection(db, 'users'), where('nationalId', '==', trimmedParentNid)));
        if (uExist.empty) {
          await addDoc(collection(db, 'users'), parentRecord);
        }
        const pExist = await getDocs(query(collection(db, 'parents'), where('nationalId', '==', trimmedParentNid)));
        if (pExist.empty) {
          await addDoc(collection(db, 'parents'), parentRecord);
        }
      } catch (docErr) {
        console.warn("Firestore parent record save warning:", docErr);
      }

      setLoginRole('parent');
      navigate('/parent');
    } catch (createErr) {
      console.error("Parent Signup Error:", createErr);
      setLoginRole('parent');
      navigate('/parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main role="main">
      <div className="login-container relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="login-card glass-panel" style={{ maxWidth: '480px', width: '100%', position: 'relative', zIndex: 10 }}>
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
              onClick={() => { setRole('student'); setIsSignup(false); setError(''); }}
              style={{ padding: '8px 2px', fontSize: '12px' }}
            >{t('login.roleStudent')}</button>
            <button 
              type="button"
              className={`role-btn ${role === 'teacher' ? 'active' : ''}`}
              onClick={() => { setRole('teacher'); setIsSignup(false); setError(''); }}
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
              onClick={() => { setRole('staff'); setIsSignup(false); setError(''); }}
              style={{ fontSize: '11px', padding: '8px 2px' }}
            >وكيل / كادر</button>
            <button 
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => { setRole('admin'); setIsSignup(false); setError(''); }}
              style={{ padding: '8px 2px', fontSize: '12px' }}
            >{t('login.roleAdmin')}</button>
          </div>

          {/* Login / Register Toggle Tabs ONLY for Parent Role */}
          {role === 'parent' && (
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
          )}

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
    </main>
  );
}
