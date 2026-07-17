"use client";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(212,175,55,0.22)',
  padding: '0.65rem 0.55rem',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.78rem',
  color: '#1A1008',
  outline: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  minWidth: 0,
};

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  let day = "";
  let month = "";
  let year = "";
  if (value) {
    const parts = value.split("-");
    if (parts.length === 3) {
      [year, month, day] = parts;
    }
  }
  const hasValue = !!(day && month && year);

  const update = (d: string, m: string, y: string) => {
    if (d && m && y) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange(null);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 131 }, (_, i) => 1900 + i);

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch' }}>
      <select
        style={{ ...selectStyle, flex: 1 }}
        value={day}
        onChange={(e) => update(e.target.value, month, year)}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={String(d).padStart(2, "0")}>{d}</option>
        ))}
      </select>
      <select
        style={{ ...selectStyle, flex: 2 }}
        value={month}
        onChange={(e) => update(day, e.target.value, year)}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{name}</option>
        ))}
      </select>
      <select
        style={{ ...selectStyle, flex: 1.5 }}
        value={year}
        onChange={(e) => update(day, month, e.target.value)}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(176,48,48,0.6)', fontSize: '0.9rem',
            padding: '0 0.4rem', display: 'flex', alignItems: 'center',
            fontFamily: 'var(--font-inter)',
          }}
          title="Clear date"
        >✕</button>
      )}
    </div>
  );
}
