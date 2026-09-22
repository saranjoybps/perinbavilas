'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { submitEditRequest } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatters';
import { getSpouses, normalizePhotos } from '@/lib/family-utils';
import { PhotoUpload, MAX_PHOTOS } from '@/components/family/photo-upload';
import { uploadImage, deleteImage } from '@/services/family/image-service';

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(26, 61, 46,0.22)',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.875rem',
  color: '#1A1008',
  outline: 'none',
};

const labelStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.68rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.4)',
  display: 'block',
  marginBottom: '0.45rem',
};

function emptySpouse() {
  return { name: '', dob: '', dod: '' };
}

function emptyChild() {
  return { code: '', name: '', dob: '', dod: '' };
}

function normalizeDate(value) {
  const formatted = formatDate(value);
  return !formatted || formatted === '-' ? '' : formatted;
}

function buildInitialForm(family) {
  const spouses = getSpouses(family).map((s) => ({
    name: s.name || '',
    dob: normalizeDate(s.dob),
    dod: normalizeDate(s.dod),
  }));

  return {
    name: family.name || '',
    dob: normalizeDate(family.dob),
    dod: normalizeDate(family.dod),
    family_name: family.family_name || '',
    occupation: family.occupation || '',
    address: family.address || '',
    email: family.email || '',
    landline: family.landline || '',
    cell_numbers: (family.cell_numbers || []).filter(Boolean).join(', '),
    spouses: spouses.length ? spouses : [emptySpouse()],
    children: (family.children || []).map((c) => ({
      code: c.code || '',
      name: c.name || '',
      dob: normalizeDate(c.dob),
      dod: normalizeDate(c.dod),
    })),
    photos: normalizePhotos(family.photos),
  };
}

function serializeForm(form, photos) {
  const spouses = (form.spouses || [])
    .map((s) => ({
      name: String(s.name || '').trim(),
      dob: String(s.dob || '').trim() || null,
      dod: String(s.dod || '').trim() || null,
    }))
    .filter((s) => s.name);

  const children = (form.children || []).map((c) => ({
    code: String(c.code || '').trim(),
    name: String(c.name || '').trim(),
    dob: String(c.dob || '').trim() || null,
    dod: String(c.dod || '').trim() || null,
  })).filter((c) => c.code || c.name);

  return {
    name: String(form.name || '').trim(),
    dob: String(form.dob || '').trim() || null,
    dod: String(form.dod || '').trim() || null,
    family_name: String(form.family_name || '').trim() || null,
    occupation: String(form.occupation || '').trim() || null,
    address: String(form.address || '').trim() || null,
    email: String(form.email || '').trim() || null,
    landline: String(form.landline || '').trim() || null,
    cell_numbers: String(form.cell_numbers || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean),
    spouses,
    spouse: spouses[0] || { name: '', dob: null, dod: null },
    children,
    photos: normalizePhotos(photos),
  };
}

export default function EditRequestForm({ family, familyCode, onSubmitted }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(family));
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const originalPhotosRef = useRef(normalizePhotos(family?.photos));
  const pendingUploadsRef = useRef(new Map());

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const updateSpouse = (index, key, value) => {
    setForm((prev) => {
      const spouses = [...prev.spouses];
      spouses[index] = { ...spouses[index], [key]: value };
      return { ...prev, spouses };
    });
  };

  const updateChild = (index, key, value) => {
    setForm((prev) => {
      const children = [...prev.children];
      children[index] = { ...children[index], [key]: value };
      return { ...prev, children };
    });
  };

  const handlePendingUpload = (file, previewUrl) => {
    pendingUploadsRef.current.set(previewUrl, file);
  };

  const handlePendingRemove = (url) => {
    if (pendingUploadsRef.current.has(url)) {
      pendingUploadsRef.current.delete(url);
      URL.revokeObjectURL(url);
    }
  };

  const handlePhotosChange = (photos) => {
    setForm((prev) => ({ ...prev, photos: normalizePhotos(photos) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const originalPhotos = originalPhotosRef.current;
    const selectedPhotos = normalizePhotos(form.photos);
    const newlyUploaded = [];

    try {
      if (selectedPhotos.length > MAX_PHOTOS) {
        throw new Error(`Maximum ${MAX_PHOTOS} photos allowed`);
      }

      const finalPhotos = [];
      for (const url of selectedPhotos) {
        const file = pendingUploadsRef.current.get(url);
        if (file) {
          const { url: realUrl } = await uploadImage(familyCode, file, finalPhotos);
          newlyUploaded.push(realUrl);
          finalPhotos.push(realUrl);
        } else if (originalPhotos.includes(url) || /^https?:\/\//i.test(url)) {
          finalPhotos.push(url);
        } else {
          throw new Error('An image selection is no longer available. Please select it again.');
        }
      }

      const changes = serializeForm(form, finalPhotos);
      await submitEditRequest(user.uid, changes, { familyCode, type: 'family' });

      for (const previewUrl of pendingUploadsRef.current.keys()) {
        URL.revokeObjectURL(previewUrl);
      }
      pendingUploadsRef.current.clear();

      setStatus('success');
      setTimeout(() => onSubmitted?.(), 1200);
    } catch (err) {
      for (const photoUrl of newlyUploaded) {
        try { await deleteImage(photoUrl); } catch { /* ignore cleanup failure */ }
      }
      setStatus('error');
      setMessage(err.message || 'Failed to submit request. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: '#1A3D2E', display: 'block', marginBottom: '1rem' }}>✦</span>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', color: '#1A1008', marginBottom: '0.4rem' }}>Request submitted</p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.5)' }}>
          An admin will review your family profile changes shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', padding: '0.6rem 1rem', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.15)' }}>
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'name', label: 'Name' },
          { name: 'family_name', label: 'Family Name' },
          { name: 'dob', label: 'Date of Birth', placeholder: 'DD-MM-YYYY' },
          { name: 'dod', label: 'Date of Death', placeholder: 'DD-MM-YYYY' },
          { name: 'occupation', label: 'Occupation' },
          { name: 'email', label: 'Email' },
          { name: 'landline', label: 'Landline' },
        ].map((f) => (
          <div key={f.name}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type="text"
              inputMode={f.placeholder ? 'numeric' : undefined}
              placeholder={f.placeholder}
              value={form[f.name]}
              onChange={(e) => updateField(f.name, e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label style={labelStyle}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
          />
        </div>
        <div className="sm:col-span-2">
          <label style={labelStyle}>Phone Numbers</label>
          <input
            type="text"
            value={form.cell_numbers}
            onChange={(e) => updateField('cell_numbers', e.target.value)}
            placeholder="Comma-separated"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
          />
        </div>
      </div>

      <div>
        <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>Photos</p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.45)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Photo changes are submitted for admin approval and will not update the family record until approved.
        </p>
        <PhotoUpload
          photos={form.photos}
          familyCode={familyCode}
          onChange={handlePhotosChange}
          onPendingUpload={handlePendingUpload}
          onPendingRemove={handlePendingRemove}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ ...labelStyle, marginBottom: 0 }}>Spouses</p>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, spouses: [...prev.spouses, emptySpouse()] }))}
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F2A1F', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            + Add Spouse
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.spouses.map((spouse, i) => (
            <div key={i} style={{ padding: '0.85rem', border: '1px solid rgba(26, 61, 46,0.15)', background: 'rgba(255,255,255,0.4)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" value={spouse.name} onChange={(e) => updateSpouse(i, 'name', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DOB</label>
                  <input type="text" placeholder="DD-MM-YYYY" value={spouse.dob} onChange={(e) => updateSpouse(i, 'dob', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DOD</label>
                  <input type="text" placeholder="DD-MM-YYYY" value={spouse.dod} onChange={(e) => updateSpouse(i, 'dod', e.target.value)} style={inputStyle} />
                </div>
              </div>
              {form.spouses.length > 1 && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, spouses: prev.spouses.filter((_, idx) => idx !== i) }))}
                  style={{ marginTop: '0.6rem', fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: '#b03030', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ ...labelStyle, marginBottom: 0 }}>Children</p>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, children: [...prev.children, emptyChild()] }))}
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F2A1F', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            + Add Child
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {form.children.length === 0 && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.4)' }}>No children listed.</p>
          )}
          {form.children.map((child, i) => (
            <div key={i} style={{ padding: '0.85rem', border: '1px solid rgba(26, 61, 46,0.15)', background: 'rgba(255,255,255,0.4)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Code</label>
                  <input type="text" value={child.code} onChange={(e) => updateChild(i, 'code', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" value={child.name} onChange={(e) => updateChild(i, 'name', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DOB</label>
                  <input type="text" placeholder="DD-MM-YYYY" value={child.dob} onChange={(e) => updateChild(i, 'dob', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DOD</label>
                  <input type="text" placeholder="DD-MM-YYYY" value={child.dod} onChange={(e) => updateChild(i, 'dod', e.target.value)} style={inputStyle} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, children: prev.children.filter((_, idx) => idx !== i) }))}
                style={{ marginTop: '0.6rem', fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: '#b03030', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={status === 'loading'}
        className="py-3 text-xs tracking-widest uppercase mt-2"
        style={{
          fontFamily: 'var(--font-inter)',
          background: '#1A1008',
          color: '#FFF7ED',
          letterSpacing: '0.14em',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Update Request'}
      </motion.button>
    </form>
  );
}
