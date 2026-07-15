import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';

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

async function requireAdmin(request) {
  const decoded = await verifyAuth(request);
  const role = decoded.role || (await adminDb.collection('users').doc(decoded.uid).get()).data()?.role;
  if (!ADMIN_ROLES.includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
}

export async function PATCH(request, { params }) {
  try {
    const reviewer = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const doc = await adminDb.collection('edit_requests').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data();
    const currentStatus = requestData.status;
    if (currentStatus !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${currentStatus}. Cannot ${action}.` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const uid = requestData.uid || requestData.userId;
      const changes = cleanProfileChanges(requestData.changes);
      if (!uid) {
        return NextResponse.json(
          { error: 'Missing user ID for approval' },
          { status: 400 }
        );
      }

      const now = new Date();
      const batch = adminDb.batch();
      batch.set(adminDb.collection('users').doc(uid), {
        ...changes,
        updatedAt: now,
      }, { merge: true });
      batch.set(adminDb.collection('authentication').doc(uid), {
        uid,
        ...(changes.displayName ? { displayName: changes.displayName } : {}),
        updatedAt: now,
      }, { merge: true });
      batch.update(adminDb.collection('edit_requests').doc(id), {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: reviewer.uid,
      });
      await batch.commit();

      if (changes.displayName) {
        await adminAuth.updateUser(uid, { displayName: changes.displayName });
      }
    } else if (action === 'deny') {
      await adminDb.collection('edit_requests').doc(id).update({
        status: 'denied',
        reviewedAt: new Date(),
        reviewedBy: reviewer.uid,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "deny".' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
