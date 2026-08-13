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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Admin override based on email for safety
          if (user.email === 'admin@admin.com' || user.email === 'admin@school.edu.sa') {
            setUserRole('admin');
          } else {
            // Fetch user role from Firestore by email
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              setUserRole(querySnapshot.docs[0].data().role);
            } else {
              setUserRole('student'); // fallback
            }
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole('student'); // Fallback
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
