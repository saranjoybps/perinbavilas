import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';

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
  return decoded;
}

export async function PATCH(request, { params }) {
  try {
    const reviewer = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;
    const permission = action === 'revoke' ? 'revoke' : action === 'grant' || action === 'approve' ? 'grant' : null;

    if (!permission) {
      return NextResponse.json(
        { error: 'Invalid action. Use "grant" or "revoke".' },
        { status: 400 }
      );
    }

    const doc = await adminDb.collection('users').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await adminDb.collection('users').doc(id).set({
      permission,
      permissionUpdatedAt: new Date(),
      permissionUpdatedBy: reviewer.uid,
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
