"use client";

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(212,175,55,0.22)',
  padding: '0.65rem 0.8rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  color: '#1A1008',
  outline: 'none',
  boxSizing: 'border-box',
};

function normalizeDate(val: string | null | undefined): string {
  if (!val) return "";
  const datePart = val.trim().split("T")[0];

  const isoParts = datePart.split("-");
  if (isoParts.length === 3 && isoParts[0].length === 4) {
    const [y, m, d] = isoParts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const displayParts = datePart.split("-");
  if (displayParts.length !== 3) return "";
  const [d, m, y] = displayParts;
  if (y.length !== 4) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      style={inputStyle}
      value={normalizeDate(value)}
      onChange={(e) => onChange(e.target.value || null)}
    />
  );
}
