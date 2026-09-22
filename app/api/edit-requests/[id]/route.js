import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { errorResponse, verifyAuth } from '@/lib/api-helpers';
import { updateRecord } from '@/services/family/firestore-service';
import { deleteImage } from '@/services/family/image-service';

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

async function cleanupPhotoDiff(previousPhotos = [], nextPhotos = []) {
  const nextSet = new Set(normalizePhotos(nextPhotos));
  const removed = normalizePhotos(previousPhotos).filter((url) => !nextSet.has(url));
  for (const url of removed) {
    try {
      await deleteImage(url);
    } catch {
      // Prefer completing the review action over failing on orphan cleanup.
    }
  }
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

    const doc = await adminDb.collection('edit_requests').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = doc.data();
    const currentStatus = requestData.status;
    if (currentStatus !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${currentStatus}. Cannot ${action}.` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const uid = requestData.uid || requestData.userId;
      const familyCode = String(requestData.familyCode || '').trim();
      const changes = cleanFamilyChanges(requestData.changes || {});
      const previousPhotos = normalizePhotos(requestData.currentValues?.photos);

      if (!uid) {
        return NextResponse.json(
          { error: 'Missing user ID for approval' },
          { status: 400 }
        );
      }

      if (!familyCode) {
        return NextResponse.json(
          { error: 'Missing Family Code for approval' },
          { status: 400 }
        );
      }

      if (!Object.keys(changes).length) {
        return NextResponse.json(
          { error: 'No valid family changes to apply' },
          { status: 400 }
        );
      }

      await updateRecord(familyCode, changes);

      if (Object.prototype.hasOwnProperty.call(changes, 'photos')) {
        await cleanupPhotoDiff(previousPhotos, changes.photos);
      }

      const now = new Date();
      const userUpdates = { updatedAt: now };
      if (changes.name) userUpdates.displayName = changes.name;
      if (Object.prototype.hasOwnProperty.call(changes, 'email') && changes.email) {
        userUpdates.email = changes.email;
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'address')) {
        userUpdates.address = changes.address || '';
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'occupation')) {
        userUpdates.profession = changes.occupation || '';
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'dob') && changes.dob) {
        userUpdates.dateOfBirth = changes.dob;
      }
      if (Object.prototype.hasOwnProperty.call(changes, 'cell_numbers')) {
        userUpdates.phone = (changes.cell_numbers || [])[0] || '';
      }

      const batch = adminDb.batch();
      batch.set(adminDb.collection('users').doc(uid), userUpdates, { merge: true });
      batch.set(adminDb.collection('authentication').doc(uid), {
        uid,
        ...(changes.name ? { displayName: changes.name } : {}),
        updatedAt: now,
      }, { merge: true });
      batch.update(adminDb.collection('edit_requests').doc(id), {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: reviewer.uid,
      });
      await batch.commit();

      if (changes.name) {
        await adminAuth.updateUser(uid, { displayName: changes.name });
      }
    } else if (action === 'deny') {
      const previousPhotos = normalizePhotos(requestData.currentValues?.photos);
      const requestedPhotos = normalizePhotos(requestData.changes?.photos);
      // Drop newly uploaded pending photos that never made it onto the family record.
      await cleanupPhotoDiff(requestedPhotos, previousPhotos);

      await adminDb.collection('edit_requests').doc(id).update({
        status: 'denied',
        reviewedAt: new Date(),
        reviewedBy: reviewer.uid,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "deny".' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, statusFor(err));
  }
}
