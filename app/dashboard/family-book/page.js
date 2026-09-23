'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkPdfAccess } from '@/lib/firebase/firestore';

const FAMILY_BOOK_PDFS = [
  {
    id: 'family-0',
    title: 'Introduction',
    subtitle: 'Family Book',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062421/_FAMILY_0_new_compressed_x5wefv.pdf',
  },
  {
    id: 'family-1',
    title: 'Family Book 1',
    subtitle: 'Part 1',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062422/FAMILY_1_new_compressed_qodmgt.pdf',
  },
  {
    id: 'family-2',
    title: 'Family Book 2',
    subtitle: 'Part 2',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062421/FAMILY_2_new_compressed_toa1yn.pdf',
  },
  {
    id: 'family-3',
    title: 'Family Book 3',
    subtitle: 'Part 3',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062421/FAMILY_3_new_compressed_vt4ejn.pdf',
  },
  {
    id: 'family-4',
    title: 'Family Book 4',
    subtitle: 'Part 4',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062421/FAMILY_4_new_compressed_cvmxxz.pdf',
  },
  {
    id: 'family-5',
    title: 'Family Book 5',
    subtitle: 'Part 5',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062422/FAMILY_5_new_compressed_o7yrqz.pdf',
  },
  {
    id: 'family-6',
    title: 'Family Book 6',
    subtitle: 'Part 6',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062422/FAMILY_6_new_compressed_k1vb3g.pdf',
  },
  {
    id: 'family-7',
    title: 'Family Book 7',
    subtitle: 'Part 7',
    url: 'https://res.cloudinary.com/bsaqrrl4/image/upload/v1790062423/FAMILY_7_new_compressed_k6ir5s.pdf',
  },
];

export default function FamilyBookPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pdfStatus, setPdfStatus] = useState('loading');

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    async function load() {
      try {
        const hasAccess = await checkPdfAccess(user.uid).catch(() => false);
        if (!cancelled) setPdfStatus(hasAccess ? 'granted' : 'revoked');
      } catch {
        if (!cancelled) setPdfStatus('revoked');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>
          Portal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>
          Family Book
        </h1>
        <span className="gold-rule block mt-3" />
      </div>

      {pdfStatus === 'granted' ? (
        <>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.5)', marginBottom: '1.5rem', lineHeight: 1.6, maxWidth: '36rem' }}>
            Choose a volume below to open the family book PDF.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FAMILY_BOOK_PDFS.map((book) => (
              <a
                key={book.id}
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-warm shadow-cloud"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  minHeight: 128,
                  padding: '1rem 0.95rem',
                  textDecoration: 'none',
                  borderTop: '2px solid rgba(15, 42, 31,0.4)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'rgba(15, 42, 31,0.75)',
                    margin: '0 0 0.55rem',
                  }}>
                    PDF
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    color: '#1A1008',
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                    {book.title}
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.72rem',
                    color: 'rgba(26,16,8,0.4)',
                    margin: '0.35rem 0 0',
                  }}>
                    {book.subtitle}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#0F2A1F',
                  marginTop: '1rem',
                }}>
                  Open →
                </span>
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-warm shadow-cloud p-5 md:p-7 text-center" style={{ borderTop: '2px solid rgba(176,48,48,0.25)', opacity: 0.85 }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.5rem', color: '#b03030', display: 'block', marginBottom: '0.75rem' }}>⊘</span>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', color: '#1A1008', marginBottom: '0.5rem' }}>
            Access Denied
          </p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.45)' }}>
            You do not have permission to view the family book.
          </p>
        </div>
      )}
    </>
  );
}
