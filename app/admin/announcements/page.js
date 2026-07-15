'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminAnnouncementsPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await getAnnouncements()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin]);

  const resetForm = () => {
    setForm({ title: '', content: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setActing('form');
    try {
      if (editingId) {
        await updateAnnouncement(editingId, { title: form.title, content: form.content });
      } else {
        await addAnnouncement({ title: form.title, content: form.content });
      }
      resetForm();
      await load();
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ title: item.title || '', content: item.content || '' });
  };

  const handleDelete = async (id) => {
    setActing(id);
    await deleteAnnouncement(id);
    await load();
    setActing(null);
    setDeleteTarget(null);
  };

  const handleCancel = () => resetForm();

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>Admin</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Announcements Management</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} className="glass-warm shadow-cloud p-5 md:p-7 mb-10 max-w-full md:max-w-lg">
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.95rem', color: '#1A1008', fontWeight: 400, marginBottom: '1.2rem' }}>
          {editingId ? 'Edit Announcement' : 'Add New Announcement'}
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title"
              style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,175,55,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#C49B1A')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.22)')}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Content *</label>
            <textarea rows={5} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Announcement content"
              style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(212,175,55,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#C49B1A')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(212,175,55,0.22)')}
            />
          </div>
          <div className="flex gap-3">
            <motion.button type="submit" disabled={acting === 'form'}
              className="px-7 py-3 text-xs tracking-widest uppercase flex-1"
              style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(196,155,26,0.45)', color: '#C49B1A', background: 'transparent', cursor: acting === 'form' ? 'wait' : 'pointer', opacity: acting === 'form' ? 0.7 : 1, letterSpacing: '0.14em', transition: 'all 0.2s' }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => { if (acting !== 'form') { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; } }}
              onMouseLeave={(e) => { if (acting !== 'form') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; } }}
            >
              {acting === 'form' ? 'Saving…' : editingId ? 'Update Announcement' : 'Add Announcement'}
            </motion.button>
            {editingId && (
              <button type="button" onClick={handleCancel}
                className="px-5 py-3 text-xs tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-inter)', background: 'transparent', color: 'rgba(26,16,8,0.4)', border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Announcements list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-warm shadow-cloud p-6 md:p-10 text-center max-w-md">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '0.75rem' }}>◎</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No announcements yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {items.map((item) => (
            <div key={item.id} className="glass-warm shadow-cloud p-4 md:p-6" style={{ borderLeft: '3px solid rgba(212,175,55,0.45)' }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.6)', marginBottom: '0.5rem' }}>
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : ''}
                  </p>
                  <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '0.5rem' }}>{item.title}</h2>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{item.content}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(item)}
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(196,155,26,0.3)', color: '#C49B1A', padding: '0.35rem 0.7rem', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => setDeleteTarget(item)} disabled={acting === item.id}
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(176,48,48,0.3)', color: '#b03030', padding: '0.35rem 0.7rem', cursor: acting === item.id ? 'wait' : 'pointer' }}>
                    {acting === item.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this announcement'}"? This action cannot be undone.`}
        loading={acting === deleteTarget?.id}
        onConfirm={() => handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
