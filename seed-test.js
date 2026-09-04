import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoLuzPsKZeMSDfxOGWpE-aBmG2PzKWcTo",
  authDomain: "al-noor-school-b2d7e.firebaseapp.com",
  projectId: "al-noor-school-b2d7e",
  storageBucket: "al-noor-school-b2d7e.firebasestorage.app",
  messagingSenderId: "907983588153",
  appId: "1:907983588153:web:aa4f77d5098d208680b6e8"
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
