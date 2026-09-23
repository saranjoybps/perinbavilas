const BASE = '';

async function request(path, options = {}) {
  const { headers: customHeaders, ...fetchOptions } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function hydrateDates(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(hydrateDates);
  const DATE_KEYS = new Set(['createdAt', 'date', 'reviewedAt']);
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (DATE_KEYS.has(key) && typeof val === 'string') {
      const ms = Date.parse(val);
      if (!isNaN(ms)) {
        result[key] = { toDate: () => new Date(ms) };
        continue;
      }
    }
    result[key] = val;
  }
  return result;
}

// ── Users ──────────────────────────────────────────────────

export const getUserProfile = async (uid) => {
  const data = await request(`/api/users/${uid}`);
  return data ? { exists: () => true, data: () => hydrateDates(data), id: data.id } : { exists: () => false, data: () => ({}), id: null };
};

export const getAllUsers = async () => {
  const data = await request('/api/users');
  return hydrateDates(data);
};

export const updateUserRole = (uid, role) =>
  request(`/api/users/${uid}`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const updateUser = (uid, data) =>
  request(`/api/users/${uid}`, { method: 'PATCH', body: JSON.stringify(data) });

export const addUser = (data) =>
  request('/api/users', { method: 'POST', body: JSON.stringify(data) });

export const bulkImportUsers = (users) =>
  request('/api/users/bulk', { method: 'POST', body: JSON.stringify({ users }) });

export const deleteUser = (uid) =>
  request(`/api/users/${uid}`, { method: 'DELETE' });

// ── Family Members ─────────────────────────────────────────

export const getFamilyMembers = async () => {
  const data = await request('/api/family-members');
  return hydrateDates(data);
};

export const addFamilyMember = (data) =>
  request('/api/family-members', { method: 'POST', body: JSON.stringify(data) });

// ── Gallery ────────────────────────────────────────────────

export const getGalleryItems = async (statusOrOpts) => {
  const opts =
    typeof statusOrOpts === 'string'
      ? { status: statusOrOpts }
      : statusOrOpts || {};
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.showOnHome != null) params.set('showOnHome', String(opts.showOnHome));
  const query = params.toString() ? `?${params}` : '';
  const data = await request(`/api/gallery${query}`);
  return hydrateDates(data);
};

export const addGalleryItem = (data) =>
  request('/api/gallery', { method: 'POST', body: JSON.stringify(data) });

export const approveGalleryItem = (id, extra = {}) =>
  request(`/api/gallery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved', ...extra }),
  });

export const updateGalleryItem = (id, data) =>
  request(`/api/gallery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteGalleryItem = (id) =>
  request(`/api/gallery/${id}`, { method: 'DELETE' });

// ── Events ─────────────────────────────────────────────────

export const getEvents = async () => {
  const data = await request('/api/events');
  return hydrateDates(data);
};

export const addEvent = (data) =>
  request('/api/events', { method: 'POST', body: JSON.stringify(data) });

export const deleteEvent = (id) =>
  request(`/api/events/${id}`, { method: 'DELETE' });

export const updateEvent = (id, data) =>
  request(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// ── Announcements ──────────────────────────────────────────

export const getAnnouncements = async () => {
  const data = await request('/api/announcements');
  return hydrateDates(data);
};

export const addAnnouncement = (data) =>
  request('/api/announcements', { method: 'POST', body: JSON.stringify(data) });

export const deleteAnnouncement = (id) =>
  request(`/api/announcements/${id}`, { method: 'DELETE' });

export const updateAnnouncement = (id, data) =>
  request(`/api/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// ── Edit Requests ──────────────────────────────────────────

export const submitEditRequest = (uid, data, meta = {}) =>
  request('/api/edit-requests', {
    method: 'POST',
    body: JSON.stringify({
      uid,
      changes: data,
      familyCode: meta.familyCode || '',
      type: meta.type || 'family',
    }),
  });

export const getPendingEditRequests = async () => {
  const data = await request('/api/edit-requests');
  return hydrateDates(data);
};

export const approveEditRequest = async (requestId) => {
  return request(`/api/edit-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve' }),
  });
};

export const denyEditRequest = (requestId) =>
  request(`/api/edit-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'deny' }),
  });

// ── PDF Access Requests ─────────────────────────────────────

export const submitPdfAccessRequest = (uid, userData) =>
  request('/api/pdf-requests', {
    method: 'POST',
    body: JSON.stringify({
      uid,
      displayName: userData.displayName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      location: userData.location || '',
    }),
  });

export const getPdfAccessRequests = async () => {
  const data = await request('/api/pdf-requests');
  return hydrateDates(data);
};

export const getPendingPdfAccessRequests = async () => {
  const data = await request('/api/pdf-requests?status=pending');
  return hydrateDates(data);
};

export const checkPdfAccess = async (uid) => {
  const data = await request(`/api/pdf-requests?mode=check&uid=${uid}`);
  return data.hasAccess;
};

export const getMyPdfRequest = async (uid) => {
  const data = await request(`/api/pdf-requests?mode=my&uid=${uid}`);
  return data ? hydrateDates(data) : null;
};

export const approvePdfAccessRequest = (requestId) =>
  request(`/api/pdf-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'approve' }),
  });

export const rejectPdfAccessRequest = (requestId) =>
  request(`/api/pdf-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reject' }),
  });

export const revokePdfAccessRequest = (requestId) =>
  request(`/api/pdf-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'revoke' }),
  });

// ── Families (Family Directory) ─────────────────────────────

export const getFamilies = async () => {
  const data = await request('/api/families');
  return data;
};

export const getFamilyByCode = (code) =>
  request(`/api/families/${encodeURIComponent(code)}`);

export const addFamily = (data) =>
  request('/api/families', { method: 'POST', body: JSON.stringify(data) });

export const updateFamily = (code, data) =>
  request(`/api/families/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteFamily = (code) =>
  request(`/api/families/${encodeURIComponent(code)}`, { method: 'DELETE' });

export const getFamilyNextCode = (parentCode, spouseFamilyCode) => {
  const query = spouseFamilyCode
    ? `?parent=${encodeURIComponent(parentCode)}&spouse=${encodeURIComponent(spouseFamilyCode)}`
    : `?parent=${encodeURIComponent(parentCode)}`;
  return request(`/api/families/next-code${query}`);
};

// ── Audit logs (login / logout) ────────────────────────────

export const getAuditLogs = async (action) => {
  const qs = action ? `?action=${encodeURIComponent(action)}&limit=150` : '?limit=150';
  const data = await request(`/api/audit-logs${qs}`);
  return Array.isArray(data) ? data.map(hydrateDates) : [];
};
