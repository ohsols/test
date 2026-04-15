import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, where, getDocs, orderBy, limit, getDocFromServer, FirestoreError, serverTimestamp, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
// Try to use the named database if provided, otherwise use (default)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("Starting Google Sign-In...");
  if (isQuotaExceeded) {
    console.warn("Firestore quota exceeded, skipping database operations during sign-in.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign-In successful:", result.user.email);

    if (isQuotaExceeded) return result.user;

    // Create user doc if it doesn't exist
    const userDoc = doc(db, 'users', result.user.uid);
    let docSnap;
    try {
      docSnap = await getDoc(userDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
      return result.user; // Return user even if doc fetch fails due to quota
    }
    
    // Check if user is an allowed admin
    let isAllowedAdmin = false;
    if (result.user.email) {
      try {
        const allowedAdminDoc = await getDoc(doc(db, 'allowed_admins', result.user.email.toLowerCase()));
        isAllowedAdmin = allowedAdminDoc.exists();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'allowed_admins');
      }
    }

    const defaultAdminEmail = 'darkfn1234567890@gmail.com';
    const isDefaultAdmin = result.user.email === defaultAdminEmail && result.user.emailVerified;

    if (!docSnap || !docSnap.exists()) {
      console.log("Creating new user document for:", result.user.email);
      
      try {
        await setDoc(userDoc, {
          uid: result.user.uid,
          email: result.user.email || null,
          displayName: result.user.displayName || null,
          photoURL: result.user.photoURL || null,
          role: (result.user.uid === 'HfjrcUIslZPCvNI3fxiQJVK1ebB3' || isAllowedAdmin || isDefaultAdmin) ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
    } else {
      // Update role if they are an admin but their role is not set to admin
      const currentRole = docSnap.data().role;
      const defaultAdminEmail = 'darkfn1234567890@gmail.com';
      const isDefaultAdmin = result.user.email === defaultAdminEmail && result.user.emailVerified;
      const shouldBeAdmin = result.user.uid === 'HfjrcUIslZPCvNI3fxiQJVK1ebB3' || isAllowedAdmin || isDefaultAdmin;
      
      if (shouldBeAdmin && currentRole !== 'admin') {
        try {
          await updateDoc(userDoc, { role: 'admin' });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'users');
        }
      }
    }
    return result.user;
  } catch (error) {
    // If it's a quota error from signInWithPopup (unlikely but possible)
    if (String(error).includes('Quota limit exceeded') || String(error).includes('Quota exceeded')) {
      isQuotaExceeded = true;
      return auth.currentUser; 
    }
    console.warn("Error signing in with Google:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, username: string) => {
  console.log("Starting Email Sign-Up for:", email);
  if (isQuotaExceeded) {
    console.warn("Firestore quota exceeded, skipping database operations during sign-up.");
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    console.log("Email Sign-Up successful:", result.user.email);
    await updateProfile(result.user, { displayName: username });
    
    if (isQuotaExceeded) return result.user;

    // Create user doc
    console.log("Creating user document for:", email);
    
    const emailLower = email.toLowerCase();
    const defaultAdminEmail = 'darkfn1234567890@gmail.com';
    const isDefaultAdmin = emailLower === defaultAdminEmail;
    let isAllowedAdmin = false;
    if (emailLower) {
      try {
        const allowedAdminDoc = await getDoc(doc(db, 'allowed_admins', emailLower));
        isAllowedAdmin = allowedAdminDoc.exists();
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'allowed_admins');
      }
    }

    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email || null,
        displayName: username || null,
        photoURL: result.user.photoURL || null,
        role: (result.user.uid === 'HfjrcUIslZPCvNI3fxiQJVK1ebB3' || isAllowedAdmin || isDefaultAdmin) ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
    
    return result.user;
  } catch (error) {
    if (String(error).includes('Quota limit exceeded') || String(error).includes('Quota exceeded')) {
      isQuotaExceeded = true;
      return auth.currentUser;
    }
    console.warn("Error signing up with email:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  console.log("Starting Email Login for:", email);
  if (isQuotaExceeded) {
    console.warn("Firestore quota exceeded, skipping database operations during login.");
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Email Login successful:", result.user.email);

    if (isQuotaExceeded) return result.user;

    const userDocRef = doc(db, 'users', result.user.uid);
    let docSnap;
    try {
      docSnap = await getDoc(userDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
    
    if (docSnap && docSnap.exists()) {
      let isAllowedAdmin = false;
      const userEmailLower = result.user.email?.toLowerCase();
      if (userEmailLower) {
        try {
          const allowedAdminDoc = await getDoc(doc(db, 'allowed_admins', userEmailLower));
          isAllowedAdmin = allowedAdminDoc.exists();
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'allowed_admins');
        }
      }
      
      const currentRole = docSnap.data().role;
      const defaultAdminEmail = 'darkfn1234567890@gmail.com';
      const isDefaultAdmin = result.user.email === defaultAdminEmail;
      const shouldBeAdmin = result.user.uid === 'HfjrcUIslZPCvNI3fxiQJVK1ebB3' || isAllowedAdmin || isDefaultAdmin;
      
      if (shouldBeAdmin && currentRole !== 'admin') {
        try {
          await updateDoc(userDocRef, { role: 'admin' });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'users');
        }
      }
    }

    return result.user;
  } catch (error) {
    if (String(error).includes('Quota limit exceeded') || String(error).includes('Quota exceeded')) {
      isQuotaExceeded = true;
      return auth.currentUser;
    }
    console.warn("Error logging in with email:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export let isQuotaExceeded = false;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  const errorString = JSON.stringify(errInfo);
  
  // If it's a quota error, don't log to console.error to keep it clean
  // and don't throw to avoid crashing the component tree
  if (errInfo.error.includes('Quota limit exceeded') || errInfo.error.includes('Quota exceeded')) {
    if (!isQuotaExceeded) {
      console.warn('Firestore Quota Exceeded:', path);
      isQuotaExceeded = true;
      // Dispatch a custom event so the UI can respond
      window.dispatchEvent(new CustomEvent('firestore-error', { detail: errInfo }));
    }
    return;
  }

  console.error('Firestore Error: ', errorString);
  window.dispatchEvent(new CustomEvent('firestore-error', { detail: errInfo }));
  throw new Error(errorString);
}

// Test connection to Firestore
async function testConnection() {
  if (isQuotaExceeded) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (String(error).includes('Quota limit exceeded') || String(error).includes('Quota exceeded')) {
      isQuotaExceeded = true;
      return;
    }
    if(error instanceof Error && error.message.includes('the client is offline')) {
      // Suppressed offline error since Firebase setup was declined
      console.warn("Firebase is offline or not configured. Some features like favorites and accounts will be disabled.");
    }
  }
}
testConnection();
