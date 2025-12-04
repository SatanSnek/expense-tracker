// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// REPLACE THIS OBJECT WITH YOUR ACTUAL CONFIG FROM THE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyD1dmJJjQ4IX9SxV04uKD1AKgkMsMYkpPA",
  authDomain: "expense-tracker-eaef1.firebaseapp.com",
  projectId: "expense-tracker-eaef1",
  storageBucket: "expense-tracker-eaef1.firebasestorage.app",
  messagingSenderId: "586899090214",
  appId: "1:586899090214:web:ed15173c3ed3378c4f6fe7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services so we can use them in App.jsx
export const auth = getAuth(app);
export const db = getFirestore(app);