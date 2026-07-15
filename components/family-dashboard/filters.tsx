"use client";

import { FilterOptions, SortField } from "@/types/family";

const labelStyle = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.62rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  color: 'rgba(26,16,8,0.42)',
  display: 'block',
  marginBottom: '0.4rem',
};

const selectStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(212,175,55,0.22)',
  padding: '0.55rem 0.7rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  color: '#1A1008',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box' as const,
};

interface FiltersProps {
  filters: FilterOptions;
  onPhotosChange: (value: boolean | null) => void;
  onSpouseChange: (value: boolean | null) => void;
  onChildrenMinChange: (value: number | null) => void;
  onSortFieldChange: (value: SortField) => void;
}

export function Filters({ filters, onPhotosChange, onSpouseChange, onChildrenMinChange, onSortFieldChange }: FiltersProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
      <div>
        <label style={labelStyle}>Photos</label>
        <select
          style={selectStyle}
          value={filters.hasPhotos === null ? 'all' : filters.hasPhotos ? 'yes' : 'no'}
          onChange={(e) => onPhotosChange(e.target.value === 'all' ? null : e.target.value === 'yes')}
        >
          <option value="all">All</option>
          <option value="yes">Has Photos</option>
          <option value="no">No Photos</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Spouse</label>
        <select
          style={selectStyle}
          value={filters.hasSpouse === null ? 'all' : filters.hasSpouse ? 'yes' : 'no'}
          onChange={(e) => onSpouseChange(e.target.value === 'all' ? null : e.target.value === 'yes')}
        >
          <option value="all">All</option>
          <option value="yes">Has Spouse</option>
          <option value="no">No Spouse</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Min Children</label>
        <input
          type="number"
          min={0}
          style={{ ...selectStyle, width: '5rem' }}
          value={filters.childrenCountMin ?? ''}
          onChange={(e) => onChildrenMinChange(e.target.value ? parseInt(e.target.value) : null)}
        />
      </div>
      <div>
        <label style={labelStyle}>Sort By</label>
        <select
          style={{ ...selectStyle, minWidth: '7rem' }}
          value={filters.sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
        >
          <option value="file">File Order</option>
          <option value="code">Code</option>
          <option value="name">Name</option>
          <option value="dob">DOB</option>
        </select>
      </div>
    </div>
  );
}
