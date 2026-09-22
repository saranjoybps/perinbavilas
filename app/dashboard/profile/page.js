'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditRequestForm from '@/components/dashboard/EditRequestForm';
import { getFamilyByCode } from '@/lib/firebase/firestore';
import { formatDate, formatName } from '@/lib/formatters';
import { getSpouses } from '@/lib/family-utils';

const labelStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.65rem',
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.35)',
  marginBottom: '0.4rem',
};

const valueStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  color: '#1A1008',
};

const sectionTitle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(15, 42, 31,0.7)',
  marginBottom: '0.75rem',
};

const codeBadge = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  padding: '0.15rem 0.45rem',
  background: 'rgba(15, 42, 31,0.08)',
  color: '#0F2A1F',
  border: '1px solid rgba(15, 42, 31,0.2)',
};

function Field({ label, value }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{value || '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const familyCode = userData?.code?.trim() || '';

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setFamily(null);

      if (!familyCode) {
        if (!cancelled) {
          setLoading(false);
          setError('No Family Code is linked to your account. Please contact an admin.');
        }
        return;
      }

      try {
        const record = await getFamilyByCode(familyCode);
        if (!cancelled) setFamily(record);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load your family record.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [authLoading, familyCode]);

  const spouses = getSpouses(family);
  const children = family?.children || [];
  const photos = family?.photos || [];

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>
          Family Record
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>
          My Profile
        </h1>
        <span className="gold-rule block mt-3" />
      </div>

      {loading || authLoading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error || !family ? (
        <div className="glass-warm shadow-cloud p-6 max-w-2xl">
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'rgba(26,16,8,0.55)', lineHeight: 1.7 }}>
            {error || 'Family record not found for your Family Code.'}
          </p>
          {familyCode && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.4)', marginTop: '0.75rem' }}>
              Linked code: <span style={codeBadge}>{familyCode}</span>
            </p>
          )}
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="glass-warm shadow-cloud p-5 md:p-8 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span style={codeBadge}>{family.code}</span>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.6rem', fontWeight: 400, color: '#1A1008', margin: 0 }}>
                {formatName(family.name) || 'Unnamed Member'}
              </h2>
            </div>

            {photos.length > 0 && (
              <div className="mb-6">
                <p style={sectionTitle}>Photos</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.5rem' }}>
                  {photos.map((photo, i) => (
                    <img
                      key={`${photo}-${i}`}
                      src={photo}
                      alt={`Family photo ${i + 1}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(26, 61, 46,0.15)' }}
                    />
                  ))}
                </div>
              </div>
            )}

            <p style={sectionTitle}>Personal Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Field label="Name" value={formatName(family.name)} />
              <Field label="Family Name" value={family.family_name} />
              <Field label="Date of Birth" value={formatDate(family.dob) !== '-' ? formatDate(family.dob) : ''} />
              <Field label="Date of Death" value={formatDate(family.dod) !== '-' ? formatDate(family.dod) : ''} />
              <Field label="Occupation" value={family.occupation} />
              <Field label="Email" value={family.email || user?.email} />
            </div>

            {spouses.length > 0 && (
              <div className="mb-6">
                <p style={sectionTitle}>Spouse{spouses.length > 1 ? 's' : ''}</p>
                <div className="flex flex-col gap-4">
                  {spouses.map((spouse, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(26, 61, 46,0.12)' }}>
                      <Field label="Name" value={formatName(spouse.name)} />
                      <Field label="DOB" value={formatDate(spouse.dob) !== '-' ? formatDate(spouse.dob) : ''} />
                      <Field label="DOD" value={formatDate(spouse.dod) !== '-' ? formatDate(spouse.dod) : ''} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p style={sectionTitle}>Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Field label="Address" value={family.address} />
              <Field label="Phone" value={(family.cell_numbers || []).filter(Boolean).join(', ')} />
              <Field label="Landline" value={family.landline} />
              <Field label="Account Email" value={user?.email} />
            </div>

            <div>
              <p style={sectionTitle}>Children ({children.length})</p>
              <div style={{ overflow: 'hidden', border: '1px solid rgba(26, 61, 46,0.12)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(26, 61, 46,0.2)' }}>
                      {['Code', 'Name', 'DOB', 'DOD'].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.6rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'rgba(26,16,8,0.42)',
                            padding: '0.55rem 0.65rem',
                            textAlign: 'left',
                            fontWeight: 500,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {children.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.35)' }}>
                          No children listed
                        </td>
                      </tr>
                    ) : (
                      children.map((child) => (
                        <tr key={child.code} style={{ borderBottom: '1px solid rgba(26, 61, 46,0.08)' }}>
                          <td style={{ padding: '0.55rem 0.65rem' }}><span style={codeBadge}>{child.code}</span></td>
                          <td style={{ padding: '0.55rem 0.65rem', fontFamily: 'var(--font-inter)', fontSize: '0.8rem' }}>{formatName(child.name)}</td>
                          <td style={{ padding: '0.55rem 0.65rem', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.55)' }}>
                            {formatDate(child.dob) !== '-' ? formatDate(child.dob) : '—'}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.55)' }}>
                            {formatDate(child.dod) !== '-' ? formatDate(child.dod) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-7 py-3 text-xs tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(15, 42, 31,0.45)',
                color: '#0F2A1F',
                background: 'transparent',
                cursor: 'pointer',
                letterSpacing: '0.14em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; }}
            >
              Edit Profile
            </button>
          ) : (
            <div className="glass-warm shadow-cloud p-5 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.15rem', color: '#1A1008', fontWeight: 400 }}>
                  Propose Changes
                </h2>
                <button
                  onClick={() => setEditing(false)}
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.45)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Changes are submitted as a profile update request. An admin must approve them before your family record is updated.
              </p>
              <EditRequestForm
                family={family}
                familyCode={family.code}
                onSubmitted={() => setEditing(false)}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
