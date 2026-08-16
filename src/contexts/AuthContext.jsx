import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          if (user.email === 'super@admin.com') {
            setUserRole('superadmin');
            setUserData({ name: 'حساب الماستر', role: 'superadmin', schoolId: 'ALL' });
          } else if (user.email === 'admin@admin.com' || user.email === 'admin@school.edu.sa') {
            setUserRole('admin');
            setUserData({ name: 'مدير المدرسة', role: 'admin', schoolId: 'default_school_1' });
          } else {
            // Fetch user role from Firestore by email
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              // If multiple docs (e.g. same national ID used for both teacher & student),
              // prioritize by role: teacher > student
              const rolePriority = { superadmin: 4, admin: 3, teacher: 2, student: 1 };
              const allDocs = querySnapshot.docs.map(d => d.data());
              const data = allDocs.sort((a, b) =>
                (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0)
              )[0];
              
              if (data.schoolId && data.schoolId !== 'ALL') {
                const schoolDoc = await getDoc(doc(db, 'schools', data.schoolId));
                if (schoolDoc.exists()) {
                  data.schoolName = schoolDoc.data().name;
                  data.logoUrl = schoolDoc.data().logoUrl || null;
                }
              }
              
              setUserRole(data.role);
              setUserData(data);
            } else {
              // No record found — don't assume student, force re-login
              setUserRole(null);
              setUserData(null);
            }
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole(null); // Don't assume student on error
          setUserData(null);
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
