import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = adminDb.collection('gallery').orderBy('createdAt', 'desc');
    if (status) {
      query = query.where('status', '==', status);
    }

    const snap = await query.get();
    const items = snap.docs.map(serializeDoc);
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const body = await request.json();
    const { url, caption } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.data() || {};
    const ref = await adminDb.collection('gallery').add({
      url,
      caption: caption || '',
      uploadedBy: decoded.uid,
      uploadedByName: userData.displayName || decoded.email || 'Unknown',
      status: 'pending',
      createdAt: new Date(),
    });

    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
