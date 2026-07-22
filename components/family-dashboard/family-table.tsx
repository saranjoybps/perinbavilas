"use client";

import { FamilyRecord, SortField } from "@/types/family";
import { formatDate, formatName } from "@/lib/formatters";

const thStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'rgba(26,16,8,0.42)',
  padding: '0.6rem 0.75rem',
  textAlign: 'left',
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
};

const tdStyle = {
  padding: '0.65rem 0.75rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  color: '#1A1008',
};

const codeBadge = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.68rem',
  letterSpacing: '0.08em',
  padding: '0.2rem 0.55rem',
  background: 'rgba(196,155,26,0.08)',
  color: '#C49B1A',
  border: '1px solid rgba(196,155,26,0.2)',
};

const actionBtn = {
  background: 'transparent',
  border: '1px solid rgba(212,175,55,0.2)',
  padding: '0.35rem 0.5rem',
  cursor: 'pointer',
  color: 'rgba(26,16,8,0.45)',
  transition: 'all 0.2s',
  fontSize: '0.8rem',
};

interface FamilyTableProps {
  records: FamilyRecord[];
  onEdit: (record: FamilyRecord) => void;
  onView: (record: FamilyRecord) => void;
  onDelete: (record: FamilyRecord) => void;
  sortField: SortField;
  sortOrder: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export function FamilyTable({ records, onEdit, onView, onDelete, sortField, sortOrder, onSort }: FamilyTableProps) {
  const SortTh = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      style={thStyle}
      onClick={() => onSort(field)}
    >
      {children} {sortField === field ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );

  return (
    <div className="glass-warm shadow-cloud" style={{ overflow: 'hidden', marginBottom: '1rem' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
              <SortTh field="code">Code</SortTh>
              <SortTh field="name">Name</SortTh>
              <th style={thStyle}>Spouse</th>
              <SortTh field="dob">DOB</SortTh>
              <th style={thStyle}>Children</th>
              <th style={thStyle}>Photos</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: 'rgba(26,16,8,0.35)' }}>
                  No families found
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.code} style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,155,26,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={tdStyle}><span style={codeBadge}>{record.code}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{formatName(record.name)}</td>
                  <td style={{ ...tdStyle, color: 'rgba(26,16,8,0.55)' }}>{formatName(record.spouse?.name) || '—'}</td>
                  <td style={{ ...tdStyle, color: 'rgba(26,16,8,0.55)' }}>{formatDate(record.dob) || '—'}</td>
                  <td style={tdStyle}>{record.children.length}</td>
                  <td style={{ ...tdStyle, color: 'rgba(26,16,8,0.55)' }}>
                    {(record.photos?.length || 0) > 0 ? `${record.photos.length} img` : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        style={actionBtn}
                        title="View"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(90,143,170,0.1)'; e.currentTarget.style.borderColor = 'rgba(90,143,170,0.3)'; e.currentTarget.style.color = '#5A8FAA'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; }}
                        onClick={() => onView(record)}
                      >◎</button>
                      <button
                        style={actionBtn}
                        title="Edit"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,155,26,0.1)'; e.currentTarget.style.borderColor = 'rgba(196,155,26,0.3)'; e.currentTarget.style.color = '#C49B1A'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; }}
                        onClick={() => onEdit(record)}
                      >◇</button>
                      <button
                        style={actionBtn}
                        title="Delete"
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(176,48,48,0.1)'; e.currentTarget.style.borderColor = 'rgba(176,48,48,0.3)'; e.currentTarget.style.color = '#b03030'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.color = 'rgba(26,16,8,0.45)'; }}
                        onClick={() => onDelete(record)}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
