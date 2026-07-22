"use client";

import { useEffect, useState } from "react";

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

function toDisplayDate(val: string | null | undefined): string {
  const normalized = normalizeDate(val);
  if (!normalized) return "";
  const [year, month, day] = normalized.split("-");
  return `${day}-${month}-${year}`;
}

function toIsoDate(val: string): string | null {
  const parts = val.trim().split("-");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

interface DatePickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [displayValue, setDisplayValue] = useState(() => toDisplayDate(value));

  useEffect(() => {
    setDisplayValue(toDisplayDate(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD-MM-YYYY"
      style={inputStyle}
      value={displayValue}
      onChange={(e) => {
        const nextValue = e.target.value;
        setDisplayValue(nextValue);
        onChange(nextValue ? toIsoDate(nextValue) : null);
      }}
    />
  );
}
