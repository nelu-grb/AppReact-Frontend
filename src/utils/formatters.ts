// Convierte cualquier entrada numérica o texto a formato moneda chilena ($500.000)
export const formatCLP = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '$0';

  // Si viene con decimales (ej. "150000.00" de PostgreSQL), toma solo la parte entera
  const rawString = String(val).split('.')[0].replace(/\D/g, '');
  const cleanNumber = parseInt(rawString, 10);

  if (isNaN(cleanNumber)) return '$0';

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(cleanNumber);
};

// Limpia el formato para obtener el número entero puro (500000) para enviarlo al backend
export const cleanCLP = (val: string | number | null | undefined): number => {
  if (!val) return 0;
  const rawString = String(val).split('.')[0].replace(/\D/g, '');
  const numeric = parseInt(rawString, 10);
  return isNaN(numeric) ? 0 : numeric;
};