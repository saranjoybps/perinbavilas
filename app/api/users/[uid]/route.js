import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ROLE_OPTIONS = ['member', 'admin'];
const ADMIN_ROLES = ['admin', 'super_admin']; // super_admin kept for legacy accounts

function normalizeRole(role) {
  if (role === 'super_admin') return 'admin';
  return ROLE_OPTIONS.includes(role) ? role : 'member';
}

function statusFor(error) {
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  return 500;
}

async function requireAdmin(request) {
  const decoded = await verifyAuth(request);
  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('Forbidden');
  }
  return { ...decoded, role };
}

function canDelete(requesterRole, targetRole) {
  if (!ADMIN_ROLES.includes(requesterRole)) return false;
  return !ADMIN_ROLES.includes(targetRole);
}

export async function GET(_, { params }) {
  try {
    const { uid } = await params;
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(serializeDoc(snap));
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);
    const { uid } = await params;
    const body = await request.json();
    const updates = { ...body, updatedAt: new Date() };
    const batch = adminDb.batch();

    if (body.role) {
      const role = normalizeRole(body.role);
      updates.role = role;
      await adminAuth.setCustomUserClaims(uid, { role });
      batch.set(adminDb.collection('authentication').doc(uid), {
        uid,
        role,
        updatedAt: new Date(),
      }, { merge: true });
    }

    batch.set(adminDb.collection('users').doc(uid), updates, { merge: true });
    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const requester = await requireAdmin(request);
    const { uid } = await params;

    const targetSnap = await adminDb.collection('users').doc(uid).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetRole = targetSnap.data().role || 'member';
    if (!canDelete(requester.role, targetRole)) {
      return NextResponse.json({ error: 'You do not have permission to delete this user' }, { status: 403 });
    }

    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
    await adminDb.collection('authentication').doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
