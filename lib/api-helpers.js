export async function verifyAuth(request) {
  const token =
    request.cookies?.get('__auth_token')?.value ||
    request.headers?.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('Unauthorized');
  }
  const { adminAuth } = await import('@/lib/firebase/admin');
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded;
}

export function serializeDoc(doc) {
  const data = doc.data();
  if (!data) return null;
  const serialized = { id: doc.id };
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      serialized[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && val.seconds != null) {
      serialized[key] = new Date(val.seconds * 1000).toISOString();
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

export function errorResponse(error, status = 500) {
  const message = error.message || 'Internal server error';
  let code = status;
  if (message === 'Unauthorized') code = 401;
  else if (message === 'Forbidden') code = 403;
  return Response.json({ error: message }, { status: code });
}
