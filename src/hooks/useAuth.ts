import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
    auth,
    isFirebaseReady,
    handleRedirectResult,
    signInWithGoogle,
    signInWithFacebook,
    sendMagicLink,
    completeMagicLinkSignIn,
    signInWithEmail,
    signUpWithEmail,
    logout,
    subscribeToUserData
} from '../../services/firebase';

export const useAuth = () => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [authMode, setAuthMode] = useState<'default' | 'email' | 'magic' | 'magic-success' | 'magic-confirm' | 'email-verify'>('default');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!isFirebaseReady) return;

        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                setIsGuest(false);
            }
        });

        handleRedirectResult();

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            setIsGuest(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleGuestMode = () => {
        setIsGuest(true);
    };

    return {
        user,
        isGuest,
        setIsGuest,
        authMode,
        setAuthMode,
        email,
        setEmail,
        password,
        setPassword,
        handleLogout,
        handleGuestMode,
        // Export auth functions for use in components
        signInWithGoogle,
        signInWithFacebook,
        sendMagicLink,
        completeMagicLinkSignIn,
        signInWithEmail,
        signUpWithEmail,
    };
};
