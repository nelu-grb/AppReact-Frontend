// Convierte cualquier entrada numérica o texto a formato moneda chilena ($500.000)
export const formatCLP = (val: string | number): string => {
  const cleanNumber = typeof val === 'number' ? val : parseInt(val.replace(/\D/g, ''), 10);
  if (isNaN(cleanNumber)) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(cleanNumber);
};

// Limpia el formato para obtener el número entero puro (500000)
export const cleanCLP = (val: string): number => {
  const numeric = parseInt(val.replace(/\D/g, ''), 10);
  return isNaN(numeric) ? 0 : numeric;
};