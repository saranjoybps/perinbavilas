'use client';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(26,16,8,0.35)', backdropFilter: 'blur(2px)',
    }} onClick={onCancel}>
      <div className="glass-warm shadow-cloud p-6 md:p-7 max-w-sm w-full mx-4"
        style={{ borderTop: '2px solid rgba(176,48,48,0.5)' }}
        onClick={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', color: '#1A1008', fontWeight: 400, marginBottom: '0.5rem' }}>
          {title || 'Confirm'}
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.55)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {message || 'Are you sure?'}
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-5 py-2 text-xs tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(26, 61, 46,0.3)', color: 'rgba(26,16,8,0.4)', background: 'transparent', cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.12em' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-5 py-2 text-xs tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-inter)', border: '1px solid rgba(176,48,48,0.35)', color: '#b03030', background: 'transparent', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, letterSpacing: '0.12em', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#b03030'; e.currentTarget.style.color = '#FFF7ED'; } }}
            onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b03030'; } }}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
