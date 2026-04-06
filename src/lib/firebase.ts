import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJeyymP1FWEANF4gTqZ4jmi8WyOe0ZYg0",
  authDomain: "secret-gpv.firebaseapp.com",
  projectId: "secret-gpv",
  storageBucket: "secret-gpv.firebasestorage.app",
  messagingSenderId: "217242230424",
  appId: "1:217242230424:web:83556c94b8c7ee1ee97aed",
  measurementId: "G-0E3V6ZYGVX",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const WORKER_BASE = "https://secretgpv.janikamo465.workers.dev";
