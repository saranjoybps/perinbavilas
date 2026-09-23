import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';
import { sendWelcomeEmailWithRetry } from '@/lib/email';
import {
  MAX_BULK_USERS,
  resolveDisplayName,
} from '@/lib/user-import';

export const maxDuration = 300;

const ROLE_OPTIONS = ['member', 'admin'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_GAP_MS = 450;
const CREATE_ATTEMPTS = 3;

function normalizeRole(role) {
  if (role === 'super_admin') return 'admin';
  return ROLE_OPTIONS.includes(role) ? role : 'member';
}

function buildUserData({ uid, email, displayName, role, code }) {
  const data = {
    uid,
    email,
    displayName,
    role,
    photoURL: '',
    phone: '',
    branch: '',
    profession: '',
    location: '',
    address: '',
    dateOfBirth: '',
    bio: '',
    permission: 'grant',
    updatedAt: new Date(),
  };
  if (code) data.code = code;
  return data;
}

function mapCreateError(err) {
  const code = err?.code || '';
  const message = err?.message || 'Failed to create user';

  if (code === 'auth/email-already-exists' || /already exists|already in use/i.test(message)) {
    return 'Email already registered — duplicate import rejected';
  }
  if (code === 'auth/invalid-email') {
    return 'Invalid email format';
  }
  if (code === 'auth/invalid-password' || /password/i.test(message)) {
    return 'Password does not meet Firebase requirements (min 6 characters)';
  }
  return message;
}

async function emailAlreadyExists(email) {
  try {
    await adminAuth.getUserByEmail(email);
    return true;
  } catch (err) {
    if (err?.code === 'auth/user-not-found') return false;
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create Auth + Firestore only after invite email has already succeeded.
 * Retries create because the member already received credentials.
 */
async function createAccountAfterInvite({
  email,
  password,
  displayName,
  role,
  code,
  nameSource,
}) {
  let lastError;
  for (let i = 0; i < CREATE_ATTEMPTS; i += 1) {
    let authUser = null;
    try {
      authUser = await adminAuth.createUser({
        email,
        password,
        displayName,
      });

      await adminAuth.setCustomUserClaims(authUser.uid, { role });

      const now = new Date();
      const userData = {
        ...buildUserData({
          uid: authUser.uid,
          email,
          displayName,
          role,
          code,
        }),
        nameSource,
        inviteEmailedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const authData = {
        uid: authUser.uid,
        email,
        displayName,
        role,
        createdAt: now,
        updatedAt: now,
      };
      if (code) authData.code = code;

      const batch = adminDb.batch();
      batch.set(adminDb.collection('users').doc(authUser.uid), userData, { merge: true });
      batch.set(adminDb.collection('authentication').doc(authUser.uid), authData, { merge: true });
      await batch.commit();

      return { authUser, userData };
    } catch (err) {
      lastError = err;
      if (authUser?.uid) {
        await adminAuth.deleteUser(authUser.uid).catch(() => {});
      }
      // Don't retry hard conflicts
      if (err?.code === 'auth/email-already-exists' || err?.code === 'auth/invalid-password') {
        throw err;
      }
      if (i < CREATE_ATTEMPTS - 1) await sleep(400 * (i + 1));
    }
  }
  throw lastError || new Error('Failed to create account');
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { users } = await request.json();
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'users array is required' }, { status: 400 });
    }
    if (users.length > MAX_BULK_USERS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_BULK_USERS} users per import. Split larger lists into batches for reliable invite emails.`,
        },
        { status: 400 },
      );
    }

    const results = {
      created: 0,
      failed: 0,
      emailed: 0,
      emailFailed: 0,
      errors: [],
    };
    const seenEmails = new Set();
    let emailsSentInBatch = 0;

    for (const entry of users) {
      const cleanEmail = String(entry.email || '').trim().toLowerCase();
      const cleanPassword = String(entry.password || '');
      const cleanCode = String(entry.code || '').trim();
      const normalizedRole = normalizeRole(entry.role);

      if (!cleanEmail || !cleanPassword) {
        results.failed++;
        results.errors.push({
          email: cleanEmail || '(missing)',
          error: 'email and temporary password are required',
        });
        continue;
      }

      if (!EMAIL_RE.test(cleanEmail)) {
        results.failed++;
        results.errors.push({ email: cleanEmail, error: 'Invalid email format' });
        continue;
      }

      if (cleanPassword.length < 6) {
        results.failed++;
        results.errors.push({ email: cleanEmail, error: 'Password must be at least 6 characters' });
        continue;
      }

      if (seenEmails.has(cleanEmail)) {
        results.failed++;
        results.errors.push({
          email: cleanEmail,
          error: 'Duplicate email in import file — skipped',
        });
        continue;
      }
      seenEmails.add(cleanEmail);

      if (await emailAlreadyExists(cleanEmail)) {
        results.failed++;
        results.errors.push({
          email: cleanEmail,
          error: 'Email already registered — duplicate import rejected',
        });
        continue;
      }

      const { displayName: cleanName, source: nameSource } = await resolveDisplayName({
        name: entry.name,
        displayName: entry.displayName,
        email: cleanEmail,
        code: cleanCode,
      });

      // 1) Invite email first — no Auth/Firestore user unless this succeeds
      if (emailsSentInBatch > 0) await sleep(EMAIL_GAP_MS);

      try {
        await sendWelcomeEmailWithRetry({
          email: cleanEmail,
          displayName: cleanName,
          password: cleanPassword,
        });
      } catch (mailErr) {
        results.failed++;
        results.emailFailed++;
        results.errors.push({
          email: cleanEmail,
          error: `Invite email failed — user was NOT created: ${mailErr?.message || 'SMTP error'}`,
        });
        console.error(`Invite email failed for ${cleanEmail}; skipping account create:`, mailErr);
        continue;
      }

      results.emailed++;
      emailsSentInBatch++;

      // 2) Only create account after invite was sent
      try {
        await createAccountAfterInvite({
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanName,
          role: normalizedRole,
          code: cleanCode,
          nameSource,
        });
        results.created++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          email: cleanEmail,
          error: `Invite email was sent, but account could not be created: ${mapCreateError(err)}. Re-try this row (email may already have the invite).`,
        });
        console.error(
          `CRITICAL: invite sent for ${cleanEmail} but account create failed:`,
          err,
        );
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (err) {
    return errorResponse(err, 500);
  }
}
