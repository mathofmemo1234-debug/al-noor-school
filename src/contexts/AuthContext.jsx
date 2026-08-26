import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [userData, setUserData] = useState(() => {
    try {
      const cached = localStorage.getItem('userData');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('userRole') || null);

  const resolveRole = useCallback(async (user, roleHint) => {
    try {
      if (user.email === 'super@admin.com') {
        const superData = { name: 'حساب الماستر', role: 'superadmin', schoolId: 'ALL' };
        setUserRole('superadmin');
        setUserData(superData);
        localStorage.setItem('userRole', 'superadmin');
        localStorage.setItem('userData', JSON.stringify(superData));
        return;
      }
      // حسابات المدراء تُقرأ من جدول users للحصول على schoolId الفعلي المعيّن من لوحة الماستر

      const nid = user.email.replace('@school.local', '');

      // 1. Fetch from 'users' collection (check by email, uid, nationalId as string or Number)
      let q = query(collection(db, 'users'), where('email', '==', user.email));
      let querySnapshot = await getDocs(q);
      if (querySnapshot.empty && user.uid) {
        q = query(collection(db, 'users'), where('uid', '==', user.uid));
        querySnapshot = await getDocs(q);
      }
      if (querySnapshot.empty && nid) {
        q = query(collection(db, 'users'), where('nationalId', '==', nid));
        querySnapshot = await getDocs(q);
        if (querySnapshot.empty && !isNaN(nid)) {
          q = query(collection(db, 'users'), where('nationalId', '==', Number(nid)));
          querySnapshot = await getDocs(q);
        }
      }

      let data = null;

      if (!querySnapshot.empty) {
        const allDocs = querySnapshot.docs.map(d => d.data());
        if (allDocs.length > 1 && roleHint) {
          data = allDocs.find(d => d.role === roleHint) || allDocs[0];
        } else {
          data = allDocs[0];
        }
      } else {
        // 2. Fallback: Check 'teachers' collection
        if (!roleHint || roleHint === 'teacher') {
          let tQ = query(collection(db, 'teachers'), where('nationalId', '==', nid));
          let tSnap = await getDocs(tQ);
          if (tSnap.empty && !isNaN(nid)) {
            tQ = query(collection(db, 'teachers'), where('nationalId', '==', Number(nid)));
            tSnap = await getDocs(tQ);
          }
          if (tSnap.empty && user.email) {
            tQ = query(collection(db, 'teachers'), where('email', '==', user.email));
            tSnap = await getDocs(tQ);
          }
          if (!tSnap.empty) {
            const tData = tSnap.docs[0].data();
            data = { ...tData, role: 'teacher', email: user.email, nationalId: String(tData.nationalId || nid) };
            // Sync to users collection
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: String(tData.nationalId || nid),
                email: user.email,
                role: 'teacher',
                name: tData.name || 'معلم',
                subject: tData.subject || '',
                schoolId: tData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync teacher to users collection", e);
            }
          }
        }

        // 3. Fallback: Check 'staff' collection
        if (!data && (!roleHint || roleHint === 'staff')) {
          let staffQ = query(collection(db, 'staff'), where('nationalId', '==', nid));
          let staffSnap = await getDocs(staffQ);
          if (staffSnap.empty && !isNaN(nid)) {
            staffQ = query(collection(db, 'staff'), where('nationalId', '==', Number(nid)));
            staffSnap = await getDocs(staffQ);
          }
          if (staffSnap.empty && user.email) {
            staffQ = query(collection(db, 'staff'), where('email', '==', user.email));
            staffSnap = await getDocs(staffQ);
          }
          if (!staffSnap.empty) {
            const staffData = staffSnap.docs[0].data();
            data = { ...staffData, role: 'staff', email: user.email, nationalId: String(staffData.nationalId || nid) };
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: String(staffData.nationalId || nid),
                email: user.email,
                role: 'staff',
                name: staffData.name || 'عضو كادر',
                roleTitle: staffData.roleTitle || '',
                permissions: staffData.permissions || [],
                schoolId: staffData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync staff to users collection", e);
            }
          }
        }

        // 4. Fallback: Check 'supervisors' collection
        if (!data && (!roleHint || roleHint === 'supervisor')) {
          let supQ = query(collection(db, 'supervisors'), where('nationalId', '==', nid));
          let supSnap = await getDocs(supQ);
          if (supSnap.empty && !isNaN(nid)) {
            supQ = query(collection(db, 'supervisors'), where('nationalId', '==', Number(nid)));
            supSnap = await getDocs(supQ);
          }
          if (supSnap.empty && user.email) {
            supQ = query(collection(db, 'supervisors'), where('email', '==', user.email));
            supSnap = await getDocs(supQ);
          }
          if (!supSnap.empty) {
            const supData = supSnap.docs[0].data();
            data = { ...supData, role: 'supervisor', email: user.email, nationalId: String(supData.nationalId || nid) };
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: String(supData.nationalId || nid),
                email: user.email,
                role: 'supervisor',
                name: supData.name || 'مشرف تعليمي',
                specialty: supData.specialty || '',
                schoolId: supData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync supervisor to users collection", e);
            }
          }
        }

        // 5. Fallback: Check 'students' collection
        if (!data && (!roleHint || roleHint === 'student')) {
          let sQ = query(collection(db, 'students'), where('nationalId', '==', nid));
          let sSnap = await getDocs(sQ);
          if (sSnap.empty && !isNaN(nid)) {
            sQ = query(collection(db, 'students'), where('nationalId', '==', Number(nid)));
            sSnap = await getDocs(sQ);
          }
          if (sSnap.empty && user.email) {
            sQ = query(collection(db, 'students'), where('email', '==', user.email));
            sSnap = await getDocs(sQ);
          }
          if (!sSnap.empty) {
            const sData = sSnap.docs[0].data();
            data = { ...sData, role: 'student', email: user.email, nationalId: String(sData.nationalId || nid) };
            // Sync to users collection
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: String(sData.nationalId || nid),
                email: user.email,
                role: 'student',
                name: sData.name || 'طالب',
                class: sData.class || sData.className || '',
                schoolId: sData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync student to users collection", e);
            }
          }
        }

        // 6. Fallback: Check 'parents' collection
        if (!data && (!roleHint || roleHint === 'parent')) {
          let pQ = query(collection(db, 'parents'), where('email', '==', user.email));
          let pSnap = await getDocs(pQ);
          if (pSnap.empty && user.uid) {
            pQ = query(collection(db, 'parents'), where('uid', '==', user.uid));
            pSnap = await getDocs(pQ);
          }
          if (pSnap.empty && nid) {
            pQ = query(collection(db, 'parents'), where('nationalId', '==', nid));
            pSnap = await getDocs(pQ);
            if (pSnap.empty && !isNaN(nid)) {
              pQ = query(collection(db, 'parents'), where('nationalId', '==', Number(nid)));
              pSnap = await getDocs(pQ);
            }
          }
          if (!pSnap.empty) {
            const pData = pSnap.docs[0].data();
            data = { ...pData, role: 'parent', email: user.email, uid: user.uid, nationalId: String(pData.nationalId || nid) };
            try {
              await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                role: 'parent',
                nationalId: String(pData.nationalId || nid),
                name: pData.name || user.displayName || 'ولي أمر',
                studentNationalId: pData.studentNationalId || '',
                studentName: pData.studentName || '',
                studentClass: pData.studentClass || '',
                schoolId: pData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync parent to users collection", e);
            }
          }
        }

        // 7. Ultimate fallback: If roleHint is provided and matches teacher/student/parent/staff/supervisor
        if (!data && roleHint) {
          data = {
            role: roleHint,
            name: roleHint === 'teacher' ? 'معلم' : roleHint === 'student' ? 'طالب' : roleHint === 'parent' ? 'ولي أمر' : 'مستخدم',
            email: user.email,
            nationalId: nid,
            schoolId: 'default_school_1'
          };
        }
      }

      if (data) {
        // Enrich class for students, subject for teachers, permissions/roleTitle for staff, specialty for supervisors, student data for parents
        if (data.role === 'parent') {
          try {
            if (data.studentNationalId) {
              const sQ = query(collection(db, 'students'), where('nationalId', '==', String(data.studentNationalId).trim()));
              const sSnap = await getDocs(sQ);
              if (!sSnap.empty) {
                const sDoc = sSnap.docs[0].data();
                data.studentName = sDoc.name || data.studentName || 'الطالب';
                data.studentClass = sDoc.class || sDoc.className || data.studentClass || '';
                data.schoolId = sDoc.schoolId || data.schoolId || 'default_school_1';
              }
            }
          } catch (e) {
            console.warn("Could not enrich parent student data", e);
          }
        } else if (data.role === 'student') {
          try {
            const sQ = query(collection(db, 'students'), where('nationalId', '==', nid));
            const sSnap = await getDocs(sQ);
            if (!sSnap.empty) {
              const sDoc = sSnap.docs[0].data();
              data.class = sDoc.class || sDoc.className || data.class || data.className || '';
              if (sDoc.name) data.name = sDoc.name;
            }
          } catch (e) {
            console.warn("Could not enrich student class", e);
          }
        } else if (data.role === 'teacher') {
          try {
            const tQ = query(collection(db, 'teachers'), where('nationalId', '==', nid));
            const tSnap = await getDocs(tQ);
            if (!tSnap.empty) {
              const tDoc = tSnap.docs[0].data();
              data.subject = tDoc.subject || data.subject || '';
              if (tDoc.name) data.name = tDoc.name;
            }
          } catch (e) {
            console.warn("Could not enrich teacher subject", e);
          }
        } else if (data.role === 'staff') {
          try {
            const staffQ = query(collection(db, 'staff'), where('nationalId', '==', nid));
            const staffSnap = await getDocs(staffQ);
            if (!staffSnap.empty) {
              const staffDoc = staffSnap.docs[0].data();
              data.roleTitle = staffDoc.roleTitle || data.roleTitle || 'عضو كادر';
              data.permissions = staffDoc.permissions || data.permissions || [];
              if (staffDoc.name) data.name = staffDoc.name;
            }
          } catch (e) {
            console.warn("Could not enrich staff data", e);
          }
        } else if (data.role === 'supervisor') {
          try {
            const supQ = query(collection(db, 'supervisors'), where('nationalId', '==', nid));
            const supSnap = await getDocs(supQ);
            if (!supSnap.empty) {
              const supDoc = supSnap.docs[0].data();
              data.specialty = supDoc.specialty || data.specialty || '';
              if (supDoc.name) data.name = supDoc.name;
            }
          } catch (e) {
            console.warn("Could not enrich supervisor specialty", e);
          }
        }

        if (data.schoolId && data.schoolId !== 'ALL') {
          try {
            const schoolDoc = await getDoc(doc(db, 'schools', data.schoolId));
            if (schoolDoc.exists()) {
              data.schoolName = schoolDoc.data().name;
              data.logoUrl = schoolDoc.data().logoUrl || null;
            }
          } catch (err) {
            console.warn("Error fetching school details", err);
          }
        }

        setUserRole(data.role);
        setUserData(data);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userData', JSON.stringify(data));
      } else {
        setUserRole(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await resolveRole(user, selectedRole);
      } else {
        setUserRole(null);
        setUserData(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [resolveRole, selectedRole]);

  const setLoginRole = useCallback((role) => {
    setSelectedRole(role);
    setUserRole(role);
    localStorage.setItem('userRole', role);
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    setLoginRole
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && !currentUser && !userRole ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--color-bg, #F4F8F9)',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(99, 178, 198, 0.2)',
            borderTopColor: '#63B2C6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '16px', color: '#4A93A6', fontWeight: 700, fontSize: '1rem' }}>
            جاري تحميل النظام...
          </p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
