// ==========================================================================
// ENVIRONMENT CONFIGURATION MODULE
// Centralized configuration management for Firebase and external services
// ==========================================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBtg8cjkIw6Z5jmOMyQOhKPpVEDdsnBvbo",
  authDomain: "online-store-bac0c.firebaseapp.com",
  projectId: "online-store-bac0c",
  storageBucket: "online-store-bac0c.firebasestorage.app",
  messagingSenderId: "165502286168",
  appId: "1:165502286168:web:65056f9bbf512a2ef48d2d",
  measurementId: "G-01R67SXE8E"
};

/**
 * Retrieve active environment configuration
 */
export function getFirebaseConfig() {
  return (typeof window !== 'undefined' && window.__ENV__?.FIREBASE_CONFIG) 
    ? window.__ENV__.FIREBASE_CONFIG 
    : FIREBASE_CONFIG;
}
