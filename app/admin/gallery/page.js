'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getGalleryItems, approveGalleryItem, deleteGalleryItem } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminGalleryPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allItems] = await Promise.all([getGalleryItems()]);
      setPending(allItems.filter((i) => i.status === 'pending'));
      setApproved(allItems.filter((i) => i.status === 'approved'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin]);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveGalleryItem(id);
      await load();
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id) => {
    setActing(id);
    try {
      await deleteGalleryItem(id);
      await load();
    } finally {
      setActing(null);
      setDeleteTarget(null);
    }
  };

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
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>Admin</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Gallery</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
            Pending Approval ({pending.length})
          </h2>
          <div className="flex flex-col gap-3 max-w-2xl">
            {pending.map((item) => (
              <div key={item.id} className="glass-warm shadow-cloud p-3 flex items-center gap-3 flex-wrap">
                <div className="relative shrink-0" style={{ width: 60, height: 60, background: '#EBF0F5', overflow: 'hidden' }}>
                  <Image src={item.url} alt={item.caption || 'Photo'} fill style={{ objectFit: 'cover' }} sizes="60px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#1A1008', fontWeight: 500 }}>
                    {item.caption || 'No caption'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'rgba(26,16,8,0.4)' }}>
                    Uploaded by {item.uploadedByName || 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={acting === item.id}
                    className="px-3 py-1 text-xs tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(196,155,26,0.45)', color: '#C49B1A', background: 'transparent', cursor: acting === item.id ? 'wait' : 'pointer', opacity: acting === item.id ? 0.6 : 1, letterSpacing: '0.14em', fontSize: '0.6rem', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { if (acting !== item.id) { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; } }}
                    onMouseLeave={(e) => { if (acting !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; } }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    disabled={acting === item.id}
                    className="px-3 py-1 text-xs tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(176,48,48,0.35)', color: '#b03030', background: 'transparent', cursor: acting === item.id ? 'wait' : 'pointer', opacity: acting === item.id ? 0.6 : 1, letterSpacing: '0.14em', fontSize: '0.6rem', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { if (acting !== item.id) { e.currentTarget.style.background = '#b03030'; e.currentTarget.style.color = '#FFF7ED'; } }}
                    onMouseLeave={(e) => { if (acting !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b03030'; } }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved photos */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
          Approved Photos ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <div className="glass-warm shadow-cloud p-10 text-center max-w-md">
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '0.75rem' }}>▣</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No approved photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {approved.map((item) => (
              <div key={item.id} className="relative group overflow-hidden" style={{ aspectRatio: '1/1', background: '#EBF0F5' }}>
                <Image src={item.url} alt={item.caption || 'Photo'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                {/* Always-visible delete button on mobile; hover-only on desktop */}
                <button onClick={() => setDeleteTarget(item)}
                  className="md:hidden absolute top-2 right-2"
                  style={{ fontFamily: 'var(--font-inter)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(176,48,48,0.75)', border: 'none', color: '#FFF7ED', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: 2 }}>
                  Delete
                </button>
                <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(26,16,8,0.45)' }}>
                  <button onClick={() => setDeleteTarget(item)}
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(255,247,237,0.12)', border: '1px solid rgba(255,247,237,0.4)', color: '#FFF7ED', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-2" style={{ background: 'linear-gradient(transparent, rgba(26,16,8,0.55))' }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'rgba(255,247,237,0.9)' }}>{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Photo"
        message={`Are you sure you want to delete this photo${deleteTarget?.caption ? `: "${deleteTarget.caption}"` : ''}? This action cannot be undone.`}
        loading={acting === deleteTarget?.id}
        onConfirm={() => handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
