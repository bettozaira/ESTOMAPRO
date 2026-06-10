import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYMfONr6w6PSIvTYCYGWWeGMIpHGy8-wk",
  authDomain: "estomapro-ce.firebaseapp.com",
  projectId: "estomapro-ce",
  storageBucket: "estomapro-ce.firebasestorage.app",
  messagingSenderId: "569216819662",
  appId: "1:569216819662:web:b16a4f8a85799cc2100b9f",
  measurementId: "G-XDL9FREHGS"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);