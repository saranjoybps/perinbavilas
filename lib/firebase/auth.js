import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';

export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
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
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
