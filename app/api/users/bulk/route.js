import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';
import { sendWelcomeEmail } from '@/lib/email';

const ROLE_OPTIONS = ['member', 'admin', 'super_admin'];

function normalizeRole(role) {
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
    if (users.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 users per bulk import' }, { status: 400 });
    }

    const results = { created: 0, failed: 0, errors: [] };

    for (const entry of users) {
      const cleanEmail = String(entry.email || '').trim().toLowerCase();
      const cleanName = String(entry.displayName || entry.name || '').trim();
      const cleanPassword = String(entry.password || '');
      const cleanCode = String(entry.code || '').trim();
      const normalizedRole = normalizeRole(entry.role);

      if (!cleanEmail || !cleanName || !cleanPassword) {
        results.failed++;
        results.errors.push({ email: cleanEmail || '(missing)', error: 'email, name, and temporary password are required' });
        continue;
      }
      if (cleanPassword.length < 6) {
        results.failed++;
        results.errors.push({ email: cleanEmail, error: 'Password must be at least 6 characters' });
        continue;
      }

      try {
        const authUser = await adminAuth.createUser({
          email: cleanEmail,
          password: cleanPassword,
          displayName: cleanName,
        });

        const now = new Date();

        await adminAuth.setCustomUserClaims(authUser.uid, { role: normalizedRole });

        const userData = {
          ...buildUserData({
            uid: authUser.uid,
            email: cleanEmail,
            displayName: cleanName,
            role: normalizedRole,
            code: cleanCode,
          }),
          createdAt: now,
          updatedAt: now,
        };

        const authData = {
          uid: authUser.uid,
          email: cleanEmail,
          displayName: cleanName,
          role: normalizedRole,
          createdAt: now,
          updatedAt: now,
        };
        if (cleanCode) authData.code = cleanCode;

        const batch = adminDb.batch();
        batch.set(adminDb.collection('users').doc(authUser.uid), userData, { merge: true });
        batch.set(adminDb.collection('authentication').doc(authUser.uid), authData, { merge: true });
        await batch.commit();

        sendWelcomeEmail({
          email: cleanEmail,
          displayName: cleanName,
          password: cleanPassword,
        }).catch((err) => {
          console.error(`Failed to send welcome email to ${cleanEmail}:`, err);
        });

        results.created++;
      } catch (err) {
        results.failed++;
        results.errors.push({ email: cleanEmail, error: err.message || 'Failed to create user' });
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (err) {
    return errorResponse(err, 500);
  }
}
