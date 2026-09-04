export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Check-in': 'border border-green-600 text-green-700 bg-green-50',
    'Check-out': 'border border-red-300 text-red-600 bg-red-50',
    'Confirmada': 'text-emerald-600 font-medium',
    'Pendiente': 'text-amber-600 font-medium',
    'Cancelada': 'text-gray-500 font-medium',
  };

  const currentStyle = styles[status] || 'text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs rounded-sm ${currentStyle}`}>
      {status}
    </span>
  );
}