import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { Beer, LogEntry } from '../types';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbVJZwJavYWujOYJbhGbuqcm_FB_-m6TA",
  authDomain: "beer-count-55993.firebaseapp.com",
  projectId: "beer-count-55993",
  storageBucket: "beer-count-55993.firebasestorage.app",
  messagingSenderId: "776733017680",
  appId: "1:776733017680:web:ff6b57ed6f57441aeff355",
  measurementId: "G-16G92W0YQK"
};

// Initialize Firebase
let app, auth, db, analytics;
let isFirebaseReady = false;
let initError: Error | null = null;

if (firebaseConfig.apiKey) {
    try {
        app = initializeApp(firebaseConfig);
        
        // Initialize Auth
        auth = getAuth(app);
        
        // Initialize Firestore
        db = getFirestore(app);
        
        // Initialize Analytics (Optional - wrapped in try/catch to prevent ad-blocker crashes)
        try {
            analytics = getAnalytics(app);
        } catch (analyticsError) {
            console.warn("Firebase Analytics failed to load (likely blocked by browser extension):", analyticsError);
        }
        
        isFirebaseReady = true;
        console.log("Firebase initialized successfully");
    } catch (e: any) {
        console.error("Firebase initialization failed:", e);
        initError = e;
        isFirebaseReady = false;
    }
} else {
    console.warn("Firebase config is missing. App will run in Guest Mode (Local Storage).");
}

export { auth, db, isFirebaseReady, initError };

export const signInWithGoogle = async () => {
  if (!auth) {
      const msg = initError ? `Init Error: ${initError.message}` : "Firebase not initialized";
      throw new Error(msg);
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  await signOut(auth);
};

// --- Database Helpers ---

export const subscribeToUserData = (userId: string, onData: (data: { logs: LogEntry[], beers: Beer[] }) => void) => {
    if (!db) return () => {};
    
    const userDocRef = doc(db, "users", userId);
    
    // Subscribe to real-time updates
    return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            onData({
                logs: data.logs || [],
                beers: data.beers || []
            });
        } else {
            // Create doc if it doesn't exist
            setDoc(userDocRef, { logs: [], beers: [] }, { merge: true });
            onData({ logs: [], beers: [] });
        }
    }, (error) => {
        console.error("Error subscribing to user data:", error);
    });
};

export const saveBeerLogToCloud = async (userId: string, log: LogEntry, beer: Beer) => {
    if (!db) return;
    const userDocRef = doc(db, "users", userId);
    
    // We use arrayUnion to add to the lists. 
    // Note: In a production app with thousands of logs, you would use a subcollection 'users/{id}/logs'.
    // For this scale, a single document array is fine and faster to implement.
    
    try {
        // Get current data to check if beer exists
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const existingBeers = data.beers || [];
            const beerExists = existingBeers.some((b: Beer) => b.id === beer.id);
            
            if (!beerExists) {
                 await updateDoc(userDocRef, {
                    beers: arrayUnion(beer),
                    logs: arrayUnion(log)
                });
            } else {
                await updateDoc(userDocRef, {
                    logs: arrayUnion(log)
                });
            }
        } else {
            await setDoc(userDocRef, {
                beers: [beer],
                logs: [log]
            });
        }
    } catch (e) {
        console.error("Error saving to cloud:", e);
    }
};