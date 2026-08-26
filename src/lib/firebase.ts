import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use custom firestoreDatabaseId if configured, or default
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
  onSnapshot,
};

export const isFirebaseConnected = !!firebaseConfig.projectId;
