import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { Beer, LogEntry } from '../types';
import { getTimeBucket } from '../src/utils/calculations';

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
        const msg = initError ? `Init Error: ${initError.message} ` : "Firebase not initialized";
        throw new Error(msg);
    }
    const provider = new GoogleAuthProvider();
    try {
        // Try popup first
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn("Popup blocked, falling back to redirect...");
            await signInWithRedirect(auth, provider);
            return null; // Will handle result on page load
        }
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const signInWithFacebook = async () => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new FacebookAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn("Popup blocked, falling back to redirect...");
            await signInWithRedirect(auth, provider);
            return null;
        }
        console.error("Error signing in with Facebook", error);
        throw error;
    }
};

export const handleRedirectResult = async () => {
    if (!auth) return null;
    try {
        const result = await getRedirectResult(auth);
        return result ? result.user : null;
    } catch (error) {
        console.error("Error handling redirect result", error);
        throw error;
    }
};

export const sendMagicLink = async (email: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    const actionCodeSettings = {
        url: window.location.href, // Redirect back to current URL
        handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
};

export const completeMagicLinkSignIn = async (emailOverride?: string) => {
    if (!auth) return null;
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = emailOverride || window.localStorage.getItem('emailForSignIn');
        if (!email) {
            throw new Error("MISSING_EMAIL");
        }
        if (email) {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            return result.user;
        }
    }
    return null;
};

export const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    const result = await signInWithEmailAndPassword(auth, email, pass);

    // Check if email is verified
    if (!result.user.emailVerified) {
        // Sign out the user
        await auth.signOut();
        throw new Error("auth/email-not-verified");
    }

    return result.user;
};

export const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not initialized");
    const result = await createUserWithEmailAndPassword(auth, email, pass);

    // Send verification email
    if (result.user) {
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(result.user);
    }

    return result.user;
};

export const logout = async () => {
    if (!auth) return;
    await signOut(auth);
};

// --- Database Helpers ---

export const subscribeToUserData = (userId: string, onData: (data: { logs: LogEntry[], beers: Beer[] }) => void) => {
    if (!db) return () => { };

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
                    logs: arrayUnion({ ...log, timeBucket: log.timeBucket || getTimeBucket(new Date(log.timestamp)) })
                });
            }
        } else {
            await setDoc(userDocRef, {
                beers: [beer],
                logs: [{ ...log, timeBucket: log.timeBucket || getTimeBucket(new Date(log.timestamp)) }]
            });
        }
    } catch (e) {
        console.error("Error saving to cloud:", e);
    }
};
