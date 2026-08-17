import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  const resolveRole = useCallback(async (user, roleHint) => {
    try {
      if (user.email === 'super@admin.com') {
        setUserRole('superadmin');
        setUserData({ name: 'حساب الماستر', role: 'superadmin', schoolId: 'ALL' });
        return;
      }
      if (user.email === 'admin@admin.com' || user.email === 'admin@school.edu.sa') {
        setUserRole('admin');
        setUserData({ name: 'مدير المدرسة', role: 'admin', schoolId: 'default_school_1' });
        return;
      }

      const nid = user.email.replace('@school.local', '');

      // 1. Fetch from 'users' collection
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

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
          const tQ = query(collection(db, 'teachers'), where('nationalId', '==', nid));
          const tSnap = await getDocs(tQ);
          if (!tSnap.empty) {
            const tData = tSnap.docs[0].data();
            data = { ...tData, role: 'teacher', email: user.email, nationalId: nid };
            // Sync to users collection
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: nid,
                email: user.email,
                role: 'teacher',
                name: tData.name || 'معلم',
                schoolId: tData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync teacher to users collection", e);
            }
          }
        }

        // 3. Fallback: Check 'staff' collection
        if (!data && (!roleHint || roleHint === 'staff')) {
          const staffQ = query(collection(db, 'staff'), where('nationalId', '==', nid));
          const staffSnap = await getDocs(staffQ);
          if (!staffSnap.empty) {
            const staffData = staffSnap.docs[0].data();
            data = { ...staffData, role: 'staff', email: user.email, nationalId: nid };
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: nid,
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
          const supQ = query(collection(db, 'supervisors'), where('nationalId', '==', nid));
          const supSnap = await getDocs(supQ);
          if (!supSnap.empty) {
            const supData = supSnap.docs[0].data();
            data = { ...supData, role: 'supervisor', email: user.email, nationalId: nid };
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: nid,
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
          const sQ = query(collection(db, 'students'), where('nationalId', '==', nid));
          const sSnap = await getDocs(sQ);
          if (!sSnap.empty) {
            const sData = sSnap.docs[0].data();
            data = { ...sData, role: 'student', email: user.email, nationalId: nid };
            // Sync to users collection
            try {
              await addDoc(collection(db, 'users'), {
                nationalId: nid,
                email: user.email,
                role: 'student',
                name: sData.name || 'طالب',
                schoolId: sData.schoolId || 'default_school_1'
              });
            } catch (e) {
              console.warn("Could not sync student to users collection", e);
            }
          }
        }
      }

      if (data) {
        // Enrich class for students, subject for teachers, permissions/roleTitle for staff, specialty for supervisors
        if (data.role === 'student') {
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
      } else {
        setUserRole(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      setUserRole(null);
      setUserData(null);
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
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [resolveRole, selectedRole]);

  const setLoginRole = useCallback((role) => {
    setSelectedRole(role);
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    setLoginRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
