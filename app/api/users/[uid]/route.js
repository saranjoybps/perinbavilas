import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ROLE_OPTIONS = ['member', 'admin', 'super_admin'];
const ADMIN_ROLES = ['admin', 'super_admin'];

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
  if (requesterRole === 'super_admin') return true;
  if (requesterRole === 'admin' && targetRole === 'member') return true;
  return false;
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
    const requester = await requireAdmin(request);
    const { uid } = await params;
    const body = await request.json();
    const updates = { ...body, updatedAt: new Date() };
    const batch = adminDb.batch();

    if (body.role) {
      if (!ROLE_OPTIONS.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      if (body.role === 'super_admin') {
        const requesterRole = requester.role || (await adminDb.collection('users').doc(requester.uid).get()).data()?.role;
        if (requesterRole !== 'super_admin') {
          return NextResponse.json({ error: 'Only super_admin can assign super_admin role' }, { status: 403 });
        }
      }
      await adminAuth.setCustomUserClaims(uid, { role: body.role });
      batch.set(adminDb.collection('authentication').doc(uid), {
        uid,
        role: body.role,
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
