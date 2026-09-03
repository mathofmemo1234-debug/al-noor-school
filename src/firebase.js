import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Determine active school database based on repository/URL context
const isAlNoor = typeof window !== 'undefined' && (
  window.location.pathname.toLowerCase().includes('al-noor') ||
  window.location.hostname.toLowerCase().includes('al-noor') ||
  window.location.href.toLowerCase().includes('al-noor')
);

// Database configuration per school
const firebaseConfig = isAlNoor ? {
  apiKey: "AIzaSyDoLuzPsKZeMSDfxOGWpE-aBmG2PzKWcTo",
  authDomain: "al-noor-school-b2d7e.firebaseapp.com",
  projectId: "al-noor-school-b2d7e",
  storageBucket: "al-noor-school-b2d7e.firebasestorage.app",
  messagingSenderId: "907983588153",
  appId: "1:907983588153:web:aa4f77d5098d208680b6e8"
} : {
  apiKey: "AIzaSyA-BaaAqrzeFzHiZpmNEwAeEB6Igd6QWKc",
  authDomain: "advanced-smart-learning-3dfbf.firebaseapp.com",
  databaseURL: "https://advanced-smart-learning-3dfbf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "advanced-smart-learning-3dfbf",
  storageBucket: "advanced-smart-learning-3dfbf.firebasestorage.app",
  messagingSenderId: "210401728875",
  appId: "1:210401728875:web:e7bf2d6626ac6d4d85542e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure session persists after page refresh
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
