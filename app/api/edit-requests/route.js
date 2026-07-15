import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ALLOWED_PROFILE_FIELDS = ['displayName', 'phone', 'branch', 'profession', 'location', 'address', 'dateOfBirth', 'bio'];
const ADMIN_ROLES = ['admin', 'super_admin'];

function statusFor(error) {
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  return 500;
}

function cleanProfileChanges(changes = {}) {
  const cleaned = {};
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(changes, field)) {
      cleaned[field] = String(changes[field] || '').trim();
    }
  }
  return cleaned;
}

function pickProfileFields(data = {}) {
  const picked = {};
  for (const field of ALLOWED_PROFILE_FIELDS) {
    picked[field] = data[field] || '';
  }
  return picked;
}

async function requireAdmin(request) {
  const decoded = await verifyAuth(request);
  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
}

export async function GET(request) {
  try {
    await requireAdmin(request);
    const snap = await adminDb
      .collection('edit_requests')
      .where('status', '==', 'pending')
      .get();
    const items = snap.docs.map(serializeDoc);
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const body = await request.json();
    const uid = decoded.uid;
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    const existing = await adminDb
      .collection('edit_requests')
      .where('uid', '==', uid)
      .get();
    const hasPending = existing.docs.some((d) => d.data().status === 'pending');
    if (hasPending) {
      return NextResponse.json(
        { error: 'You already have a pending edit request.' },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const currentValues = pickProfileFields(userData);
    const changes = cleanProfileChanges(body.changes);
    const hasChanges = Object.entries(changes).some(([field, value]) => value !== (currentValues[field] || ''));

    if (!Object.keys(changes).length || !hasChanges) {
      return NextResponse.json(
        { error: 'Change at least one profile field before submitting.' },
        { status: 400 }
      );
    }

    const ref = await adminDb.collection('edit_requests').add({
      uid,
      userId: uid,
      displayName: userData.displayName || decoded.name || '',
      email: userData.email || decoded.email || '',
      role: userData.role || 'member',
      currentValues,
      changes,
      status: 'pending',
      createdAt: new Date(),
    });
    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
