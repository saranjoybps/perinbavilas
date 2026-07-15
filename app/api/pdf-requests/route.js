import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ADMIN_ROLES = ['admin', 'super_admin'];

function normalizePermission(permission) {
  return permission === 'revoke' ? 'revoke' : 'grant';
}

function statusFor(error) {
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  return 500;
}

async function requireSelfOrAdmin(request, uid) {
  const decoded = await verifyAuth(request);
  if (decoded.uid === uid) return decoded;

  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
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
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const mode = searchParams.get('mode');

    if (mode === 'check') {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required' }, { status: 400 });
      }
      await requireSelfOrAdmin(request, uid);
      const snap = await adminDb.collection('users').doc(uid).get();
      const permission = normalizePermission(snap.data()?.permission);
      return NextResponse.json({ hasAccess: permission === 'grant', permission });
    }

    if (mode === 'my') {
      if (!uid) {
        return NextResponse.json({ error: 'uid is required' }, { status: 400 });
      }
      await requireSelfOrAdmin(request, uid);
      const snap = await adminDb.collection('users').doc(uid).get();
      if (!snap.exists) return NextResponse.json(null);
      const data = serializeDoc(snap);
      return NextResponse.json({ ...data, permission: normalizePermission(data.permission) });
    }

    await requireAdmin(request);
    const snap = await adminDb.collection('users').get();
    const items = snap.docs.map((doc) => {
      const data = serializeDoc(doc);
      return {
        ...data,
        uid: data.uid || data.id,
        permission: normalizePermission(data.permission),
      };
    });
    items.sort((a, b) => {
      const aName = (a.displayName || a.email || '').toLowerCase();
      const bName = (b.displayName || b.email || '').toLowerCase();
      return aName.localeCompare(bName);
    });
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid } = body;
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    await requireSelfOrAdmin(request, uid);
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const data = serializeDoc(snap);
    return NextResponse.json({ ...data, permission: normalizePermission(data.permission) }, { status: 201 });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
