import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-BaaAqrzeFzHiZpmNEwAeEB6Igd6QWKc",
  authDomain: "advanced-smart-learning-3dfbf.firebaseapp.com",
  databaseURL: "https://advanced-smart-learning-3dfbf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "advanced-smart-learning-3dfbf",
  storageBucket: "advanced-smart-learning-3dfbf.firebasestorage.app",
  messagingSenderId: "210401728875",
  appId: "1:210401728875:web:e7bf2d6626ac6d4d85542e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const docRef = await addDoc(collection(db, "test_collection"), {
      test: "data"
    });
    console.log("Success! ID:", docRef.id);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
