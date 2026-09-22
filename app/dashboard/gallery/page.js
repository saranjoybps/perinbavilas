'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getGalleryItems, addGalleryItem } from '@/lib/firebase/firestore';
import { motion } from 'framer-motion';

export default function DashboardGalleryPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [approved, setApproved] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [allItems] = await Promise.all([
        getGalleryItems(),
      ]);
      const uid = user?.uid;
      setApproved(allItems.filter((i) => i.status === 'approved'));
      setMyUploads(allItems.filter((i) => i.uploadedBy === uid));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.url) throw new Error('Upload failed');
      await addGalleryItem({ url: data.url, caption });
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      setMessage('Image submitted for approval.');
      await load();
    } catch (err) {
      setMessage('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

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
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>Portal</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Gallery</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Upload form */}
      <div className="glass-warm shadow-cloud p-5 md:p-7 mb-8 max-w-lg">
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1.2rem' }}>Upload a Photo</h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          {message && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: message.startsWith('Upload failed') ? '#b03030' : '#2f6b42', padding: '0.5rem 0.8rem', background: message.startsWith('Upload failed') ? 'rgba(176,48,48,0.06)' : 'rgba(47,107,66,0.07)', border: `1px solid ${message.startsWith('Upload failed') ? 'rgba(176,48,48,0.16)' : 'rgba(47,107,66,0.16)'}` }}>
              {message}
            </p>
          )}
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>
              Image File
            </label>
            <input
              type="file" accept="image/*" ref={fileRef} required
              style={{ width: '100%', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#1A1008', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.6rem 0.8rem' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>
              Caption
            </label>
            <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
          <motion.button type="submit" disabled={uploading}
            className="px-7 py-3 text-xs tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(15, 42, 31,0.45)', color: '#0F2A1F', background: 'transparent', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1, letterSpacing: '0.14em', transition: 'all 0.2s' }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onMouseEnter={(e) => { if (!uploading) { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; } }}
            onMouseLeave={(e) => { if (!uploading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; } }}
          >
            {uploading ? 'Uploading…' : 'Submit for Approval'}
          </motion.button>
        </form>
      </div>

      {/* My uploads */}
      {myUploads.length > 0 && (
        <div className="mb-10">
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
            My Uploads ({myUploads.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {myUploads.map((item) => (
              <div key={item.id} className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: '#EBF0F5' }}>
                <Image src={item.url} alt={item.caption || 'Upload'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                <div className="absolute top-2 right-2" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: item.status === 'approved' ? 'rgba(47,107,66,0.85)' : 'rgba(15, 42, 31,0.85)', color: '#FFF7ED', borderRadius: 2 }}>
                  {item.status}
                </div>
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-2" style={{ background: 'linear-gradient(transparent, rgba(26,16,8,0.55))' }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'rgba(255,247,237,0.9)' }}>{item.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved gallery */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
          Gallery
        </h2>
        {approved.length === 0 ? (
          <div className="glass-warm shadow-cloud p-10 text-center max-w-md">
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#1A3D2E', marginBottom: '0.75rem' }}>▣</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No approved photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {approved.map((item) => (
              <div key={item.id} className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: '#EBF0F5', borderTop: '2px solid rgba(26, 61, 46,0.2)' }}>
                <Image src={item.url} alt={item.caption || 'Gallery photo'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
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
    </>
  );
}
