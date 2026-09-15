const normalizeCLPValue = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || val === '') return null;

  let raw = String(val).trim();

  if (raw === '') return null;

  if (raw.includes(',') && raw.includes('.')) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',') && !raw.includes('.')) {
    raw = raw.replace(',', '.');
  } else if (raw.includes('.')) {
    const parts = raw.split('.');
    const lastPart = parts[parts.length - 1];
    const looksLikeThousandsSeparator = parts.length > 1 && (parts.length > 2 || lastPart.length === 3);

    if (looksLikeThousandsSeparator) {
      raw = parts.join('');
    }
  }

  const numeric = Number(raw.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

// Convierte cualquier entrada numérica o texto a formato moneda chilena ($500.000)
export const formatCLP = (val: string | number | null | undefined): string => {
  const cleanNumber = normalizeCLPValue(val);

  if (cleanNumber === null) return '$0';

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(cleanNumber));
};

// Limpia el formato para obtener el número entero puro (500000) para enviarlo al backend
export const cleanCLP = (val: string | number | null | undefined): number => {
  const numeric = normalizeCLPValue(val);
  return numeric === null ? 0 : Math.round(numeric);
};