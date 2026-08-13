// ==========================================================================
// FIREBASE CONFIGURATION & INITIALIZATION (Modular SDK)
// ES Modules compatible with native browser import
// ==========================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getFirebaseConfig } from './config.js';

// Initialize Firebase with environment configuration
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication & Cloud Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
