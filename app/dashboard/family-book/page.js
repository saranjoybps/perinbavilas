'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkPdfAccess } from '@/lib/firebase/firestore';
import { getFamilies } from '@/lib/api';
import { PdfPreview } from '@/components/family/pdf-preview';

export default function FamilyBookPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pdfStatus, setPdfStatus] = useState('loading');
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    async function load() {
      try {
        const hasAccess = await checkPdfAccess(user.uid).catch(() => false);
        if (cancelled) return;
        setPdfStatus(hasAccess ? 'granted' : 'revoked');

        if (hasAccess) {
          const families = await getFamilies();
          if (!cancelled) setRecords(families);
        }
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
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>
          Portal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Family Book</h1>
        <span className="gold-rule block mt-3" />
      </div>

      <div className="glass-warm shadow-cloud p-5 md:p-7 mb-10" style={{ borderTop: '2px solid rgba(212,175,55,0.35)' }}>
        <div className="flex items-center gap-3 mb-4">
          <span style={{ fontSize: '1.2rem', color: '#C49B1A' }}>PDF</span>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', color: '#1A1008', fontWeight: 400 }}>
            Family Directory
          </h2>
        </div>

        {pdfStatus === 'granted' ? (
          <div>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.5)', marginBottom: '1rem' }}>
              You have access to view the family directory.
            </p>
            <PdfPreview records={records}>
              <button
                style={{
                  fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.14em',
                  textTransform: 'uppercase', padding: '0.65rem 1.5rem',
                  border: '1px solid rgba(196,155,26,0.45)', background: '#C49B1A',
                  color: '#FFF7ED', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#b38b17'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#C49B1A'; }}
              >
                Generate PDF
              </button>
            </PdfPreview>
          </div>
        ) : (
          <div className="text-center py-16" style={{ opacity: 0.6 }}>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.5rem', color: '#b03030', display: 'block', marginBottom: '0.75rem' }}>⊘</span>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', color: '#1A1008', marginBottom: '0.5rem' }}>Access Denied</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.45)' }}>
              You do not have permission to view the family book.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
