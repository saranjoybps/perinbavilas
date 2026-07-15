import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';
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

function removeUndefined(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function statusFor(error) {
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  return 500;
}

async function requireAdmin(request) {
  const decoded = await verifyAuth(request);
  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!['admin', 'super_admin'].includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
}

async function requireSelfOrAdmin(request, uid) {
  const decoded = await verifyAuth(request);
  if (decoded.uid === uid) return decoded;

  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!['admin', 'super_admin'].includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
}

export async function GET(request) {
  try {
    await requireAdmin(request);
    const snap = await adminDb.collection('users').get();
    const users = snap.docs.map(serializeDoc);
    return NextResponse.json(users);
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, email, password, displayName, name, role: rawRole, code, ...data } = body;
    const role = normalizeRole(rawRole);

    if (!uid) {
      await requireAdmin(request);

      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(displayName || name || '').trim();
      const cleanPassword = String(password || '');
      const cleanCode = String(code || '').trim();

      if (!cleanEmail || !cleanName || !cleanPassword) {
        return NextResponse.json({ error: 'email, name, and temporary password are required' }, { status: 400 });
      }

      if (cleanPassword.length < 6) {
        return NextResponse.json({ error: 'Temporary password must be at least 6 characters' }, { status: 400 });
      }

      const authUser = await adminAuth.createUser({
        email: cleanEmail,
        password: cleanPassword,
        displayName: cleanName,
      });

      try {
        await adminAuth.setCustomUserClaims(authUser.uid, { role });

        const now = new Date();
        const userData = {
          ...buildUserData({
            uid: authUser.uid,
            email: cleanEmail,
            displayName: cleanName,
            role,
            code: cleanCode,
          }),
          createdAt: now,
          updatedAt: now,
        };

        const authData = {
          uid: authUser.uid,
          email: cleanEmail,
          displayName: cleanName,
          role,
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
          console.error('Failed to send welcome email:', err);
        });

        return NextResponse.json({ id: authUser.uid, ...userData }, { status: 201 });
      } catch (err) {
        await adminAuth.deleteUser(authUser.uid).catch(() => {});
        throw err;
      }
    }

    const existing = await adminDb.collection('users').doc(uid).get();
    await requireSelfOrAdmin(request, uid);
    const existingData = existing.exists ? existing.data() : {};
    const nextRole = existing.exists
      ? normalizeRole(existingData.role || rawRole)
      : 'member';
    if (!existing.exists) {
      data.createdAt = new Date();
    }
    const userData = removeUndefined({
      ...data,
      email,
      displayName,
      role: nextRole,
      permission: existingData.permission || data.permission || 'grant',
      updatedAt: new Date(),
    });
    await adminAuth.setCustomUserClaims(uid, { role: nextRole });
    const batch = adminDb.batch();
    batch.set(adminDb.collection('users').doc(uid), userData, { merge: true });
    batch.set(adminDb.collection('authentication').doc(uid), removeUndefined({
      uid,
      email,
      displayName,
      role: nextRole,
      updatedAt: new Date(),
      ...(code ? { code } : {}),
    }), { merge: true });
    await batch.commit();
    return NextResponse.json({ id: uid, ...userData });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
