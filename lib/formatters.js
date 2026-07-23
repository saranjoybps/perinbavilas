export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '-';

  const dateValue = value?.toDate ? value.toDate() : value;
  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    return `${String(dateValue.getDate()).padStart(2, '0')}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${dateValue.getFullYear()}`;
  }

  const text = String(dateValue).trim();
  if (!text) return '-';

  if (/^\d{4}$/.test(text)) {
    return text;
  }

  const datePart = text.split('T')[0];
  const yearFirstMatch = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yearFirstMatch) return `${yearFirstMatch[3].padStart(2, '0')}-${yearFirstMatch[2].padStart(2, '0')}-${yearFirstMatch[1]}`;

  const displayMatch = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (displayMatch) return `${displayMatch[1].padStart(2, '0')}-${displayMatch[2].padStart(2, '0')}-${displayMatch[3]}`;

  if (/^\d{4}[-/]\d{1,2}$/.test(datePart)) {
    return text;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return `${String(parsed.getDate()).padStart(2, '0')}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${parsed.getFullYear()}`;
}

export function formatName(value) {
  if (!value) return '';
  return String(value).replace(/([A-Za-z])\.(?=[A-Za-z])/g, '$1. ');
}
