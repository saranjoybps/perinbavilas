'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getEvents, addEvent, updateEvent, deleteEvent } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/formatters';

function toIsoDate(value) {
  const parts = value.trim().split('-');
  if (parts.length !== 3) return value;
  const [day, month, year] = parts;
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return value;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default function AdminEventsPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await getEvents()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    load();
  }, [authLoading, isAdmin]);

  const resetForm = () => {
    setForm({ title: '', date: '', location: '', description: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setActing('form');
    try {
      if (editingId) {
        await updateEvent(editingId, {
          title: form.title,
          date: new Date(toIsoDate(form.date)),
          location: form.location,
          description: form.description,
        });
      } else {
        await addEvent({
          title: form.title,
          date: new Date(toIsoDate(form.date)),
          location: form.location,
          description: form.description,
        });
      }
      resetForm();
      await load();
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      date: item.date?.toDate ? item.date.toDate().toISOString().split('T')[0] : item.date || '',
      location: item.location || '',
      description: item.description || '',
    });
  };

  const handleDelete = async (id) => {
    setActing(id);
    await deleteEvent(id);
    await load();
    setActing(null);
    setDeleteTarget(null);
  };

  const handleCancel = () => resetForm();

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>Admin</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Events Management</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} className="glass-warm shadow-cloud p-5 md:p-7 mb-10 max-w-full md:max-w-lg">
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.95rem', color: '#1A1008', fontWeight: 400, marginBottom: '1.2rem' }}>
          {editingId ? 'Edit Event' : 'Add New Event'}
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Date *</label>
            <input type="text" inputMode="numeric" placeholder="DD-MM-YYYY" required value={formatDate(form.date)} onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Event location"
              style={{ width: '100%', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.4rem' }}>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Event description"
              style={{ width: '100%', resize: 'vertical', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(26, 61, 46,0.22)', padding: '0.7rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
            />
          </div>
          <div className="flex gap-3">
            <motion.button type="submit" disabled={acting === 'form'}
              className="px-7 py-3 text-xs tracking-widest uppercase flex-1"
              style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(15, 42, 31,0.45)', color: '#0F2A1F', background: 'transparent', cursor: acting === 'form' ? 'wait' : 'pointer', opacity: acting === 'form' ? 0.7 : 1, letterSpacing: '0.14em', transition: 'all 0.2s' }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => { if (acting !== 'form') { e.currentTarget.style.background = '#0F2A1F'; e.currentTarget.style.color = '#FFF7ED'; } }}
              onMouseLeave={(e) => { if (acting !== 'form') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#0F2A1F'; } }}
            >
              {acting === 'form' ? 'Saving…' : editingId ? 'Update Event' : 'Add Event'}
            </motion.button>
            {editingId && (
              <button type="button" onClick={handleCancel}
                className="px-5 py-3 text-xs tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-inter)', background: 'transparent', color: 'rgba(26,16,8,0.4)', border: '1px solid rgba(26, 61, 46,0.3)', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Events list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-warm shadow-cloud p-6 md:p-10 text-center max-w-md">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#1A3D2E', marginBottom: '0.75rem' }}>◷</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No events yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-2xl">
          {items.map((item) => {
            const dateObj = item.date?.toDate ? item.date.toDate() : null;
            const dateStr = formatDate(dateObj || item.date);
            return (
              <div key={item.id} className="glass-warm shadow-cloud p-4 md:p-6" style={{ borderTop: '2px solid rgba(26, 61, 46,0.35)' }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-2 md:gap-4 min-w-0 flex-1">
                    {dateObj && (
                      <div className="shrink-0" style={{ minWidth: 44, textAlign: 'center', padding: '0.4rem 0.5rem', background: 'rgba(26, 61, 46,0.08)', border: '1px solid rgba(26, 61, 46,0.2)' }}>
                        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.5rem', color: '#0F2A1F', lineHeight: 1 }}>{String(dateObj.getDate()).padStart(2, '0')}</p>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.35)' }}>
                          {String(dateObj.getMonth() + 1).padStart(2, '0')}
                        </p>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '0.3rem' }}>{item.title}</h2>
                      {item.location && (
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(15, 42, 31,0.7)', marginBottom: '0.4rem' }}>📍 {item.location}</p>
                      )}
                      {item.description && (
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.55)', lineHeight: 1.7 }}>{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEdit(item)}
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(15, 42, 31,0.3)', color: '#0F2A1F', padding: '0.35rem 0.7rem', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget(item)} disabled={acting === item.id}
                      style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(176,48,48,0.3)', color: '#b03030', padding: '0.35rem 0.7rem', cursor: acting === item.id ? 'wait' : 'pointer' }}>
                      {acting === item.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this event'}"? This action cannot be undone.`}
        loading={acting === deleteTarget?.id}
        onConfirm={() => handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
