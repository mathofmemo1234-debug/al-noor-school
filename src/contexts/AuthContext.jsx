import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [selectedRole, setSelectedRole] = useState(null);

  const resolveRole = useCallback(async (user, roleHint) => {
    try {
      if (user.email === 'super@admin.com') {
        setUserRole('superadmin');
        setUserData({ name: '\u062d\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0633\u062a\u0631', role: 'superadmin', schoolId: 'ALL' });
        return;
      }
      if (user.email === 'admin@admin.com' || user.email === 'admin@school.edu.sa') {
        setUserRole('admin');
        setUserData({ name: '\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u062f\u0631\u0633\u0629', role: 'admin', schoolId: 'default_school_1' });
        return;
      }

      // Fetch all user records for this email
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const allDocs = querySnapshot.docs.map(d => d.data());
        let data;

        if (allDocs.length > 1 && roleHint) {
          // Multiple records exist — use the role hint from login page selection
          data = allDocs.find(d => d.role === roleHint) || allDocs[0];
        } else {
          data = allDocs[0];
        }

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

  // Called from Login.jsx before navigation to set role hint
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
