'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import {
  getGalleryItems,
  addGalleryItem,
  approveGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import GalleryImageFrame from '@/components/gallery/GalleryImageFrame';

const labelStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.65rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.4)',
  display: 'block',
  marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(26, 61, 46,0.22)',
  padding: '0.7rem 1rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.875rem',
  color: '#1A1008',
  outline: 'none',
};

const checkboxRow = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.55rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  color: 'rgba(26,16,8,0.72)',
  lineHeight: 1.45,
};

export default function AdminGalleryPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
  const [message, setMessage] = useState('');
  const [approveHome, setApproveHome] = useState({});
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const allItems = await getGalleryItems();
      setPending(allItems.filter((i) => i.status === 'pending'));
      setApproved(allItems.filter((i) => i.status === 'approved'));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin]);

  const handleDirectPublish = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'pvtweb/gallery');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.url) throw new Error(data.error || 'Upload failed');

      await addGalleryItem({
        url: data.url,
        publicId: data.publicId || '',
        caption,
        status: 'approved',
        showOnHome,
      });

      setCaption('');
      setShowOnHome(false);
      if (fileRef.current) fileRef.current.value = '';
      setMessage('Image published to the website gallery.');
      await load();
    } catch (err) {
      setMessage('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveGalleryItem(id, {
        showOnHome: Boolean(approveHome[id]),
      });
      setApproveHome((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  const handleToggleHome = async (item) => {
    setActing(item.id);
    try {
      await updateGalleryItem(item.id, { showOnHome: !item.showOnHome });
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
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>Admin</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Gallery</h1>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.5)', marginTop: '0.5rem', maxWidth: 520, lineHeight: 1.55 }}>
          Approve member submissions or publish images directly. Use “Show on Home” to feature photos in the home Gallery section.
        </p>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Admin direct upload + publish */}
      <div className="glass-warm shadow-cloud p-5 md:p-7 mb-10 max-w-lg">
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1.2rem' }}>
          Upload &amp; Publish
        </h2>
        <form onSubmit={handleDirectPublish} className="flex flex-col gap-4">
          {message && (
            <p style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.78rem',
              color: message.startsWith('Upload failed') ? '#b03030' : '#2f6b42',
              padding: '0.5rem 0.8rem',
              background: message.startsWith('Upload failed') ? 'rgba(176,48,48,0.06)' : 'rgba(47,107,66,0.07)',
              border: `1px solid ${message.startsWith('Upload failed') ? 'rgba(176,48,48,0.16)' : 'rgba(47,107,66,0.16)'}`,
            }}>
              {message}
            </p>
          )}
          <div>
            <label style={labelStyle}>Image File</label>
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              required
              style={{ ...inputStyle, padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption…"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#0F2A1F'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(26, 61, 46,0.22)'; }}
            />
          </div>
          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              style={{ marginTop: 3, accentColor: '#0F2A1F' }}
            />
            <span>
              Show on Home page Gallery section
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(26,16,8,0.45)', marginTop: 2 }}>
                Unchecked images appear only on the Gallery page.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="px-7 py-3 text-xs tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid rgba(15, 42, 31,0.45)',
              color: '#0F2A1F',
              background: 'transparent',
              cursor: uploading ? 'wait' : 'pointer',
              opacity: uploading ? 0.7 : 1,
              letterSpacing: '0.14em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = '#0F2A1F';
                e.currentTarget.style.color = '#FFF7ED';
              }
            }}
            onMouseLeave={(e) => {
              if (!uploading) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#0F2A1F';
              }
            }}
          >
            {uploading ? 'Publishing…' : 'Publish to Website'}
          </button>
        </form>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
            Pending Approval ({pending.length})
          </h2>
          <div className="flex flex-col gap-4 max-w-2xl">
            {pending.map((item) => (
              <div key={item.id} className="glass-warm shadow-cloud p-4 flex flex-col sm:flex-row gap-4">
                <div className="sm:w-40 shrink-0">
                  <GalleryImageFrame
                    src={item.url}
                    alt={item.caption || 'Pending photo'}
                    maxHeight="140px"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-3">
                  <div>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#1A1008', fontWeight: 500 }}>
                      {item.caption || 'No caption'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'rgba(26,16,8,0.4)', marginTop: 4 }}>
                      Uploaded by {item.uploadedByName || 'Unknown'}
                    </p>
                  </div>
                  <label style={checkboxRow}>
                    <input
                      type="checkbox"
                      checked={Boolean(approveHome[item.id])}
                      onChange={(e) =>
                        setApproveHome((prev) => ({ ...prev, [item.id]: e.target.checked }))
                      }
                      style={{ marginTop: 3, accentColor: '#0F2A1F' }}
                    />
                    <span>Show on Home page Gallery section</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={acting === item.id}
                      className="px-3 py-1.5 text-xs tracking-widest uppercase"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        border: '1px solid rgba(15, 42, 31,0.45)',
                        color: '#0F2A1F',
                        background: 'transparent',
                        cursor: acting === item.id ? 'wait' : 'pointer',
                        opacity: acting === item.id ? 0.6 : 1,
                        letterSpacing: '0.14em',
                        fontSize: '0.6rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (acting !== item.id) {
                          e.currentTarget.style.background = '#0F2A1F';
                          e.currentTarget.style.color = '#FFF7ED';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (acting !== item.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#0F2A1F';
                        }
                      }}
                    >
                      Approve &amp; Publish
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      disabled={acting === item.id}
                      className="px-3 py-1.5 text-xs tracking-widest uppercase"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        border: '1px solid rgba(176,48,48,0.35)',
                        color: '#b03030',
                        background: 'transparent',
                        cursor: acting === item.id ? 'wait' : 'pointer',
                        opacity: acting === item.id ? 0.6 : 1,
                        letterSpacing: '0.14em',
                        fontSize: '0.6rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (acting !== item.id) {
                          e.currentTarget.style.background = '#b03030';
                          e.currentTarget.style.color = '#FFF7ED';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (acting !== item.id) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#b03030';
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved photos */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '1rem' }}>
          Published Photos ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <div className="glass-warm shadow-cloud p-10 text-center max-w-md">
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#1A3D2E', marginBottom: '0.75rem' }}>▣</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No published photos yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {approved.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <GalleryImageFrame
                  src={item.url}
                  alt={item.caption || 'Gallery photo'}
                  caption={item.caption}
                  maxHeight="min(50vh, 360px)"
                />
                <label style={{ ...checkboxRow, fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(item.showOnHome)}
                    disabled={acting === item.id}
                    onChange={() => handleToggleHome(item)}
                    style={{ marginTop: 2, accentColor: '#0F2A1F' }}
                  />
                  <span>Show on Home page</span>
                </label>
                <button
                  onClick={() => setDeleteTarget(item)}
                  disabled={acting === item.id}
                  style={{
                    alignSelf: 'flex-start',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(176,48,48,0.35)',
                    color: '#b03030',
                    background: 'transparent',
                    padding: '0.35rem 0.7rem',
                    cursor: acting === item.id ? 'wait' : 'pointer',
                    opacity: acting === item.id ? 0.6 : 1,
                  }}
                >
                  Delete
                </button>
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
