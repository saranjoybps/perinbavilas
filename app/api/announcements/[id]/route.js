import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { errorResponse } from '@/lib/api-helpers';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await adminDb.collection('announcements').doc(id).update(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await adminDb.collection('announcements').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
