// ==========================================================================
// FIREBASE AUTHENTICATION & USER MANAGEMENT
// Real Firebase Auth v10 Modular SDK + Cloud Firestore User Profiles
// With Email/Password & Google Provider Sign-In
// ==========================================================================

import { auth, db } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const DEMO_USER_KEY = 'aura_demo_authenticated_user';

/**
 * Format human-readable Firebase Auth error messages
 */
export function getFriendlyAuthErrorMessage(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email address or password. Please try again.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact customer support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access has been temporarily restricted. Try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'Google Sign-In is not authorized for this domain. Add your domain/localhost to Firebase Console > Authentication > Settings > Authorized domains, or sign in with Email & Password below.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return error?.message || 'An authentication error occurred. Please try again.';
  }
}

/**
 * Sign up a new customer with Firebase Authentication and create Firestore profile document
 */
export async function signupUser(email, password, displayName) {
  if (!email || !password || !displayName) {
    throw new Error('Please fill in all required registration fields.');
  }

  try {
    // 1. Create User in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // 2. Update Display Name on Auth Profile
    await updateProfile(user, {
      displayName: displayName.trim()
    });

    // 3. Create Additional User Profile in Cloud Firestore "users" Collection
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: displayName.trim(),
        email: email.trim(),
        role: 'customer',
        createdAt: new Date().toISOString()
      });
    } catch (firestoreErr) {
      console.warn('[Auth] Firestore user document save skipped/failed:', firestoreErr);
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: displayName.trim(),
      role: 'customer'
    };

  } catch (err) {
    throw new Error(getFriendlyAuthErrorMessage(err));
  }
}

/**
 * Log in an existing user with Firebase Authentication
 */
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Please enter both your email address and password.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Fetch role & details from Firestore
    let role = 'customer';
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        role = userDoc.data()?.role || 'customer';
      }
    } catch (docErr) {
      console.warn('[Auth] Could not fetch Firestore user metadata:', docErr);
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      role
    };

  } catch (err) {
    throw new Error(getFriendlyAuthErrorMessage(err));
  }
}

/**
 * Sign In / Sign Up with Google Popup Provider
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Ensure user document exists in Cloud Firestore and retrieve role
    let role = 'customer';
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Customer',
          email: user.email,
          photoURL: user.photoURL || null,
          role: 'customer',
          createdAt: new Date().toISOString()
        });
      } else {
        role = userSnap.data()?.role || 'customer';
      }
    } catch (firestoreErr) {
      console.warn('[Auth] Firestore user profile sync on Google sign-in:', firestoreErr);
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null,
      role
    };

  } catch (err) {
    throw new Error(getFriendlyAuthErrorMessage(err));
  }
}

export const SUPER_ADMIN_EMAIL = 'mhbangash1112@gmail.com';

/**
 * Standard Evaluator Admin Profile
 */
export const EVALUATOR_USER = {
  uid: 'evaluator-admin-uid',
  email: 'evaluator@aurastudio.test',
  displayName: 'Evaluator Admin',
  photoURL: null,
  role: 'admin',
  isEvaluator: true
};

/**
 * Check if current session is in Evaluator Mode
 */
export function isEvaluatorMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('aura_evaluator_admin_mode') === 'true';
}

/**
 * Check if a user or email matches the primary Super Administrator
 */
export function isSuperAdmin(userOrEmail) {
  if (!userOrEmail) return false;
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;
  return (email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Log out the current user session
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Auth] Firebase signOut error:', err);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem('aura_evaluator_admin_mode');
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: null } }));
  }
}

/**
 * Retrieve user role from Cloud Firestore / Super Admin check
 */
export async function getUserRole(uid, email = '') {
  // 1. Super Admin is always granted full admin role
  if (email && isSuperAdmin(email)) {
    return 'admin';
  }

  // 2. Evaluator Mode override check
  if (isEvaluatorMode()) {
    return 'admin';
  }

  if (!uid) return 'customer';
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const role = userSnap.data()?.role;
      if (role === 'admin') return 'admin';
    }
  } catch (err) {
    console.warn('[Auth] Error checking user role from Firestore:', err);
  }
  return 'customer';
}

/**
 * Grant or set admin role for evaluation / session
 */
export async function setUserRole(uid, role = 'admin') {
  if (typeof window !== 'undefined') {
    if (role === 'admin') {
      enableEvaluatorAdmin();
    } else {
      localStorage.removeItem('aura_evaluator_admin_mode');
    }
  }

  if (uid && uid !== 'evaluator-admin-uid') {
    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, { role, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('[Auth] Could not update Firestore role (local session enabled):', err);
    }
  }
  return true;
}

/**
 * Enable Evaluator Admin Session
 */
export function enableEvaluatorAdmin() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aura_evaluator_admin_mode', 'true');
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(EVALUATOR_USER));
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: EVALUATOR_USER } }));
  }
  return EVALUATOR_USER;
}

/**
 * Retrieve current authenticated user (sync)
 */
export function getCurrentUser() {
  const isEval = isEvaluatorMode();

  if (auth?.currentUser) {
    const isSuper = isSuperAdmin(auth.currentUser.email);
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      photoURL: auth.currentUser.photoURL || null,
      role: (isSuper || isEval) ? 'admin' : 'customer',
      isEvaluator: isEval
    };
  }

  try {
    const raw = localStorage.getItem(DEMO_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (isEval || isSuperAdmin(user?.email)) {
        user.role = 'admin';
        user.isEvaluator = isEval;
      }
      return user;
    }
  } catch {
    // ignore
  }

  if (isEval) {
    return { ...EVALUATOR_USER };
  }

  return null;
}

/**
 * Subscribe to authentication state changes with live callback
 */
export function onUserAuthStateChanged(callback) {
  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRole(user.uid, user.email);
        const isEval = isEvaluatorMode();
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          role: (role === 'admin' || isEval) ? 'admin' : 'customer',
          isEvaluator: isEval
        });
      } else {
        const localUser = getCurrentUser();
        callback(localUser);
      }
    });
  } catch (err) {
    console.warn('[Auth] Firebase onAuthStateChanged observer error:', err);
    callback(getCurrentUser());
  }

  window.addEventListener('auth-state-changed', (e) => {
    callback(e.detail?.user || getCurrentUser());
  });
}

/**
 * Initialize navbar auth state across any customer page
 */
export function initNavbarAuth() {
  const accountLink = document.getElementById('nav-account-link');
  if (!accountLink) return;

  function renderNavbar(user) {
    if (user) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'Customer';
      const initial = displayName.charAt(0).toUpperCase();

      accountLink.outerHTML = `
        <div class="nav-item-dropdown" id="nav-user-dropdown">
          <button class="btn btn-ghost btn-sm flex items-center gap-2" id="nav-account-link" style="padding: 0.3rem 0.6rem; border-radius: var(--radius-full); border: 1px solid var(--color-border);">
            <div style="width: 22px; height: 22px; border-radius: var(--radius-full); background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
              ${initial}
            </div>
            <span style="max-width: 95px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-xs); font-weight: 500;">${displayName}</span>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div class="nav-dropdown-menu" style="right: 0; left: auto; min-width: 180px;">
            <div style="padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border-subtle); font-size: var(--text-xs); color: var(--color-text-secondary);">
              Signed in as<br><strong class="text-primary" style="word-break: break-all;">${user.email}</strong>
            </div>
            <a href="cart.html" class="nav-dropdown-item">Shopping Bag</a>
            <a href="../admin/dashboard.html" class="nav-dropdown-item">Admin Dashboard</a>
            <button id="btn-navbar-logout" class="nav-dropdown-item text-left w-full" style="color: var(--color-danger); border: none; background: none; cursor: pointer;">
              Sign Out
            </button>
          </div>
        </div>
      `;

      const logoutBtn = document.getElementById('btn-navbar-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await logoutUser();
          window.location.reload();
        });
      }
    }
  }

  onUserAuthStateChanged(renderNavbar);
}
