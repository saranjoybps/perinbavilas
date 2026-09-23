import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ADMIN_ROLES = ['admin', 'super_admin'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const showOnHome = searchParams.get('showOnHome');

    // Filter in memory so we don't require a Firestore composite index
    const snap = await adminDb.collection('gallery').orderBy('createdAt', 'desc').get();
    let items = snap.docs.map(serializeDoc);

    if (status) {
      items = items.filter((item) => item.status === status);
    }
    if (showOnHome === 'true') {
      items = items.filter((item) => item.showOnHome === true);
    } else if (showOnHome === 'false') {
      items = items.filter((item) => !item.showOnHome);
    }

    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const body = await request.json();
    const { url, caption, publicId, status: rawStatus, showOnHome } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.data() || {};
    const role = decoded.role || userData.role;
    const isAdmin = ADMIN_ROLES.includes(role);

    // Members always create pending requests; admins may publish immediately
    const status = isAdmin && rawStatus === 'approved' ? 'approved' : 'pending';

    const ref = await adminDb.collection('gallery').add({
      url,
      publicId: publicId || '',
      caption: caption || '',
      uploadedBy: decoded.uid,
      uploadedByName: userData.displayName || decoded.email || 'Unknown',
      status,
      showOnHome: Boolean(showOnHome),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
