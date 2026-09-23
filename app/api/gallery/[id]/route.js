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

    const updates = { updatedAt: new Date() };
    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.caption === 'string') updates.caption = body.caption;
    if (typeof body.showOnHome === 'boolean') updates.showOnHome = body.showOnHome;

    await adminDb.collection('gallery').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await adminDb.collection('gallery').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
