"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const btnStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  padding: '0.55rem 1.2rem',
  border: '1px solid rgba(196,155,26,0.3)',
  background: 'transparent',
  color: 'rgba(26,16,8,0.45)',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem' }}>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'rgba(26,16,8,0.4)' }}>
        Page {page} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          style={btnStyle}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; e.currentTarget.style.borderColor = '#C49B1A'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; e.currentTarget.style.borderColor = 'rgba(196,155,26,0.3)'; }}
        >
          ← Previous
        </button>
        <button
          style={btnStyle}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; e.currentTarget.style.borderColor = '#C49B1A'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; e.currentTarget.style.borderColor = 'rgba(196,155,26,0.3)'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
