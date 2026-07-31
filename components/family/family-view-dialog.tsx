"use client";

import { FamilyRecord } from "@/types/family";
import { formatDate, formatName } from "@/lib/formatters";
import { getSpouses } from "@/lib/family-utils";

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(212,175,55,0.22)',
  padding: '0.55rem 0.7rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  color: '#1A1008',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const thStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.42)',
  padding: '0.45rem 0.55rem',
  textAlign: 'left',
  fontWeight: 500,
};

const tdStyle = {
  padding: '0.45rem 0.55rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.75rem',
  color: '#1A1008',
};

const codeBadge = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.08em',
  padding: '0.15rem 0.45rem',
  background: 'rgba(196,155,26,0.08)',
  color: '#C49B1A',
  border: '1px solid rgba(196,155,26,0.2)',
};

interface FamilyViewDialogProps {
  record: FamilyRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FamilyViewDialog({ record, open, onOpenChange }: FamilyViewDialogProps) {
  if (!record || !open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={() => onOpenChange(false)}>
      <div className="glass-warm shadow-cloud"
        style={{ width: '100%', maxWidth: '40rem', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem 2rem', borderTop: '2px solid rgba(196,155,26,0.4)' }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span style={codeBadge}>{record.code}</span>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 400, color: '#1A1008' }}>{formatName(record.name)}</span>
        </div>

        {record.photos && record.photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {record.photos.map((photo, i) => (
              <img key={i} src={photo} alt={`Photo ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.15)' }} />
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.5rem' }}>Personal Details</p>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#1A1008', lineHeight: 2 }}>
              <div>DOB: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{formatDate(record.dob) || 'N/A'}</span></div>
              <div>DOD: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{formatDate(record.dod) || 'N/A'}</span></div>
              {record.family_name && <div>Family: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{record.family_name}</span></div>}
              {record.occupation && <div>Occupation: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{record.occupation}</span></div>}
            </div>
          </div>
          <div>
            {getSpouses(record).length > 0 && (
              <>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.5rem' }}>
                  Spouse{getSpouses(record).length > 1 ? 's' : ''}
                </p>
                <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#1A1008', lineHeight: 2 }}>
                  {getSpouses(record).map((spouse, i) => (
                    <div key={i} style={{ marginBottom: i < getSpouses(record).length - 1 ? '0.5rem' : 0 }}>
                      <div style={{ fontWeight: 500 }}>{formatName(spouse.name)}</div>
                      {spouse.dob && <div style={{ color: 'rgba(26,16,8,0.55)' }}>DOB: {formatDate(spouse.dob)}</div>}
                      {spouse.dod && <div style={{ color: 'rgba(26,16,8,0.55)' }}>DOD: {formatDate(spouse.dod)}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {(record.address || record.cell_numbers.length > 0 || record.email) && (
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.5rem' }}>Contact</p>
            <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#1A1008', lineHeight: 2 }}>
              {record.address && <div>{record.address}</div>}
              {record.cell_numbers.length > 0 && <div>Phone: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{record.cell_numbers.join(', ')}</span></div>}
              {record.email && <div>Email: <span style={{ color: 'rgba(26,16,8,0.55)' }}>{record.email}</span></div>}
            </div>
          </div>
        )}

        <div>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.5rem' }}>
            Children ({record.children.length})
          </p>
          <div style={{ overflow: 'hidden', border: '1px solid rgba(212,175,55,0.12)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>DOB</th>
                </tr>
              </thead>
              <tbody>
                {record.children.length === 0 ? (
                  <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', padding: '1rem', color: 'rgba(26,16,8,0.35)' }}>No children</td></tr>
                ) : (
                  record.children.map((child) => (
                    <tr key={child.code} style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                      <td style={tdStyle}><span style={codeBadge}>{child.code}</span></td>
                      <td style={tdStyle}>{formatName(child.name)}</td>
                      <td style={{ ...tdStyle, color: 'rgba(26,16,8,0.55)' }}>{formatDate(child.dob) || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.25rem' }}>
          <button style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.55rem 1.4rem', border: '1px solid rgba(196,155,26,0.3)', background: 'transparent', color: 'rgba(26,16,8,0.45)', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => onOpenChange(false)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
