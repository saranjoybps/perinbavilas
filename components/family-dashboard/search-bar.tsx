"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(15, 42, 31,0.22)',
  padding: '0.7rem 0.85rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.82rem',
  color: '#1A1008',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
};

export function SearchBar({ value, onChange, placeholder = "Search by family code (e.g. 11 or 1/2) or name..." }: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 42, 31,0.5)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 42, 31,0.22)'; }}
    />
  );
}
