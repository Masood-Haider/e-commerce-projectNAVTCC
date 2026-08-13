// ==========================================================================
// FIREBASE CONFIGURATION & INITIALIZATION (Modular SDK)
// ES Modules compatible with native browser import
// ==========================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// Live Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtg8cjkIw6Z5jmOMyQOhKPpVEDdsnBvbo",
  authDomain: "online-store-bac0c.firebaseapp.com",
  projectId: "online-store-bac0c",
  storageBucket: "online-store-bac0c.firebasestorage.app",
  messagingSenderId: "165502286168",
  appId: "1:165502286168:web:65056f9bbf512a2ef48d2d",
  measurementId: "G-01R67SXE8E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication & Cloud Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
