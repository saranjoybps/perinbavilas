'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

const DEFAULT_ROLE = 'member';
const ADMIN_ROLES = ['admin', 'super_admin']; // super_admin kept only for legacy accounts

function normalizeRole(role) {
  if (ADMIN_ROLES.includes(role)) return 'admin';
  return DEFAULT_ROLE;
}

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  role: DEFAULT_ROLE,
  isAdmin: false,
});

export default function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [role,     setRole]     = useState(DEFAULT_ROLE);
  const [isAdmin,  setIsAdmin]  = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setRole(DEFAULT_ROLE);
        // Cookie first — before any await — so login→portal redirect isn't blocked
        try {
          document.cookie = `__auth_token=${await firebaseUser.getIdToken()}; path=/; SameSite=Lax; max-age=3600`;
        } catch {
          /* ignore */
        }
        try {
          const res = await fetch(`/api/users/${firebaseUser.uid}`);
          if (res.ok) {
            const data = await res.json();
            const normalizedRole = normalizeRole(data.role);
            setUserData({ ...data, role: normalizedRole });
            setRole(normalizedRole);
            setIsAdmin(normalizedRole === 'admin');
          } else {
            console.warn('Auth: Failed to fetch user role', res.status, await res.text().catch(() => ''));
          }
        } catch (err) {
          console.warn('Auth: API unavailable', err);
        }
      } else {
        setUser(null);
        setUserData(null);
        setRole(DEFAULT_ROLE);
        setIsAdmin(false);
        document.cookie = '__auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, role, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
