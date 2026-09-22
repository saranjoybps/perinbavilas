import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { serializeDoc, errorResponse, verifyAuth } from '@/lib/api-helpers';
import { getRecordByCode } from '@/services/family/firestore-service';

const ADMIN_ROLES = ['admin', 'super_admin'];

const FAMILY_SCALAR_FIELDS = [
  'name',
  'dob',
  'dod',
  'family_name',
  'occupation',
  'address',
  'email',
  'landline',
];

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

function normalizeDate(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeSpouses(spouses = [], spouse) {
  const list = (Array.isArray(spouses) && spouses.length
    ? spouses
    : spouse?.name
      ? [spouse]
      : []
  )
    .map((s) => ({
      name: String(s?.name || '').trim(),
      dob: normalizeDate(s?.dob),
      dod: normalizeDate(s?.dod),
    }))
    .filter((s) => s.name);

  return list;
}

function normalizeChildren(children = []) {
  return (Array.isArray(children) ? children : [])
    .map((c) => ({
      code: String(c?.code || '').trim(),
      name: String(c?.name || '').trim(),
      dob: normalizeDate(c?.dob),
      dod: normalizeDate(c?.dod),
    }))
    .filter((c) => c.code || c.name);
}

function normalizeCellNumbers(value) {
  if (Array.isArray(value)) {
    return value.map((n) => String(n || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

function normalizePhotos(photos = []) {
  const seen = new Set();
  return (Array.isArray(photos) ? photos : [])
    .map((p) => String(p || '').trim())
    .filter((p) => {
      if (!p || seen.has(p)) return false;
      if (!/^https?:\/\//i.test(p)) return false;
      seen.add(p);
      return true;
    })
    .slice(0, 2);
}

function pickFamilySnapshot(record = {}) {
  const spouses = normalizeSpouses(record.spouses, record.spouse);
  return {
    name: record.name || '',
    dob: normalizeDate(record.dob),
    dod: normalizeDate(record.dod),
    family_name: record.family_name || null,
    occupation: record.occupation || null,
    address: record.address || null,
    email: record.email || null,
    landline: record.landline || null,
    cell_numbers: normalizeCellNumbers(record.cell_numbers),
    spouses,
    spouse: spouses[0] || { name: '', dob: null, dod: null },
    children: normalizeChildren(record.children),
    photos: normalizePhotos(record.photos),
  };
}

function cleanFamilyChanges(changes = {}) {
  const cleaned = {};

  for (const field of FAMILY_SCALAR_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(changes, field)) {
      if (field === 'name') {
        cleaned.name = String(changes.name || '').trim();
      } else if (field === 'dob' || field === 'dod') {
        cleaned[field] = normalizeDate(changes[field]);
      } else {
        const value = String(changes[field] || '').trim();
        cleaned[field] = value || null;
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'cell_numbers')) {
    cleaned.cell_numbers = normalizeCellNumbers(changes.cell_numbers);
  }

  if (
    Object.prototype.hasOwnProperty.call(changes, 'spouses') ||
    Object.prototype.hasOwnProperty.call(changes, 'spouse')
  ) {
    const spouses = normalizeSpouses(changes.spouses, changes.spouse);
    cleaned.spouses = spouses;
    cleaned.spouse = spouses[0] || { name: '', dob: null, dod: null };
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'children')) {
    cleaned.children = normalizeChildren(changes.children);
  }

  if (Object.prototype.hasOwnProperty.call(changes, 'photos')) {
    cleaned.photos = normalizePhotos(changes.photos);
  }

  return cleaned;
}

function stable(value) {
  return JSON.stringify(value ?? null);
}

function hasMeaningfulChanges(currentValues, changes) {
  return Object.keys(changes).some((key) => stable(changes[key]) !== stable(currentValues[key]));
}

export async function GET(request) {
  try {
    await requireAdmin(request);
    const snap = await adminDb
      .collection('edit_requests')
      .where('status', '==', 'pending')
      .get();
    const items = snap.docs.map(serializeDoc);
    return NextResponse.json(items);
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}

export async function POST(request) {
  try {
    const decoded = await verifyAuth(request);
    const body = await request.json();
    const uid = decoded.uid;
    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    const existing = await adminDb
      .collection('edit_requests')
      .where('uid', '==', uid)
      .get();
    const hasPending = existing.docs.some((d) => d.data().status === 'pending');
    if (hasPending) {
      return NextResponse.json(
        { error: 'You already have a pending edit request.' },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const familyCode = String(body.familyCode || userData.code || '').trim();

    if (!familyCode) {
      return NextResponse.json(
        { error: 'No Family Code is linked to your account.' },
        { status: 400 }
      );
    }

    if (userData.code && String(userData.code).trim() !== familyCode) {
      return NextResponse.json(
        { error: 'Family Code does not match your account.' },
        { status: 403 }
      );
    }

    const familyRecord = await getRecordByCode(familyCode);
    if (!familyRecord) {
      return NextResponse.json(
        { error: `Family record not found for code ${familyCode}.` },
        { status: 404 }
      );
    }

    const currentValues = pickFamilySnapshot(familyRecord);
    const changes = cleanFamilyChanges(body.changes || {});

    if (!Object.keys(changes).length || !hasMeaningfulChanges(currentValues, changes)) {
      return NextResponse.json(
        { error: 'Change at least one family profile field before submitting.' },
        { status: 400 }
      );
    }

    const ref = await adminDb.collection('edit_requests').add({
      uid,
      userId: uid,
      displayName: userData.displayName || familyRecord.name || decoded.name || '',
      email: userData.email || decoded.email || '',
      role: userData.role === 'admin' || userData.role === 'super_admin' ? 'admin' : 'member',
      familyCode,
      type: 'family',
      currentValues,
      changes,
      status: 'pending',
      createdAt: new Date(),
    });
    const doc = await ref.get();
    return NextResponse.json(serializeDoc(doc), { status: 201 });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
