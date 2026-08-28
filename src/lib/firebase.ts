import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use custom firestoreDatabaseId if configured, or default
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Enforce browserLocalPersistence so session stays active across page refreshes and deploys
if (typeof window !== 'undefined') {
  try {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Auth] Persistence set warning:', err);
    });
  } catch (err) {
    console.warn('[Firebase Auth] Persistence init error:', err);
  }
}

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
};

export type { FirebaseUser };

export const isFirebaseConnected = !!firebaseConfig.projectId;

