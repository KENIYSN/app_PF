import { initializeApp } from "firebase/app";
import { initializeAuth, inMemoryPersistence } from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD3wVp9rOjfJgXhDZJKAHnFkPsjP6RpkWg",
  authDomain: "apppfe-56e58.firebaseapp.com",
  projectId: "apppfe-56e58",
  storageBucket: "apppfe-56e58.appspot.com",
  messagingSenderId: "785051339321",
  appId: "1:785051339321:web:9d9940112b8ea36b9bdbe8",
  measurementId: "G-74PJMPE0D2"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
const auth = initializeAuth(app, {
  persistence: inMemoryPersistence, 
});

export { auth };
export const db = getFirestore(app);