import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';

const ACTIONS = new Set(['login', 'logout']);

function statusFor(error) {
  if (error.message === 'Unauthorized') return 401;
  if (error.message === 'Forbidden') return 403;
  if (error.message === 'Invalid action') return 400;
  return 500;
}

async function requireAdmin(request) {
  const decoded = await verifyAuth(request);
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  const role = decoded.role || snap.data()?.role;
  if (!['admin', 'super_admin'].includes(role)) {
    throw new Error('Forbidden');
  }
  return decoded;
}

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
}

/** POST — record login or logout for the authenticated user */
export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (!ACTIONS.has(action)) {
      throw new Error('Invalid action');
    }

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const role = userData.role === 'super_admin' ? 'admin' : (userData.role || 'member');

    const ref = await adminDb.collection('audit_logs').add({
      action,
      uid: decoded.uid,
      email: userData.email || decoded.email || '',
      displayName: userData.displayName || decoded.name || '',
      role,
      userAgent: request.headers.get('user-agent') || null,
      ip: clientIp(request),
      createdAt: new Date(),
    });

    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (error) {
    return errorResponse(error, statusFor(error));
  }
}

/** GET — admin only: list login/logout audit logs */
export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limitRaw = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Math.min(Math.max(limitRaw || 100, 1), 300);

    // Fetch a bit extra when filtering so result set stays useful without a composite index
    const fetchLimit = action && ACTIONS.has(action) ? Math.min(limit * 3, 500) : limit;

    const snap = await adminDb
      .collection('audit_logs')
      .orderBy('createdAt', 'desc')
      .limit(fetchLimit)
      .get();

    let logs = snap.docs.map(serializeDoc);
    if (action && ACTIONS.has(action)) {
      logs = logs.filter((row) => row.action === action).slice(0, limit);
    }

    return NextResponse.json(logs);
  } catch (error) {
    return errorResponse(error, statusFor(error));
  }
}
