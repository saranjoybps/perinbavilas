import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Set cookie immediately so /dashboard proxy/middleware won't bounce back to /login
  try {
    const token = await cred.user.getIdToken();
    document.cookie = `__auth_token=${token}; path=/; SameSite=Lax; max-age=3600`;
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'login' }),
    });
  } catch {
    /* never block sign-in if audit write fails */
  }
  return cred;
}

export async function signUpWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  const token = await cred.user.getIdToken();
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      uid:         cred.user.uid,
      email,
      displayName,
      role:        'member',
      photoURL:    '',
      phone:       '',
      branch:      '',
      profession:  '',
      location:    '',
      address:     '',
      dateOfBirth: '',
      bio:         '',
      permission:  'grant',
    }),
  });
  return cred;
}

export async function signOutUser() {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'logout' }),
      });
    }
  } catch {
    /* never block sign-out if audit write fails */
  }
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
