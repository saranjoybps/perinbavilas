import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const snap = await adminDb
      .collection('events')
      .orderBy('date', 'asc')
      .get();
    const items = snap.docs.map(serializeDoc);
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = {
      ...body,
      date: body.date ? new Date(body.date) : null,
      createdAt: new Date(),
    };
    const ref = await adminDb.collection('events').add(data);
    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
