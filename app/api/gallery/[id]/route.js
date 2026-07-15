import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';

const ADMIN_ROLES = ['admin', 'super_admin'];

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
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    await adminDb.collection('gallery').doc(id).update({
      ...body,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await adminDb.collection('gallery').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
