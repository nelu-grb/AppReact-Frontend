import { useEffect, useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { getReportKpis, type ReportKpis } from '../services/reportService';
import { getReservations, type ReservationResponse } from '../services/reservationService';
import { parseApiError } from '../utils/errorHandler';

export default function Reports() {
  const { isAdmin, isAuditor } = useUserRole();
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && !isAuditor) return;
    Promise.all([getReportKpis(), getReservations()])
      .then(([kpiData, reservationData]) => {
        setKpis(kpiData);
        setReservations(reservationData);
      })
      .catch((loadError) => setError(parseApiError(loadError)));
  }, [isAdmin, isAuditor]);

  if (!isAdmin && !isAuditor) return <Restricted />;
  if (error) return <PageMessage text={error} />;
  if (!kpis) return <PageMessage text="Cargando datos de reportería..." />;

  const hourlyEntries = Object.entries(kpis.reservationsByHour);
  const statusCounts = reservations.reduce<Record<string, number>>((result, reservation) => {
    result[reservation.status] = (result[reservation.status] ?? 0) + 1;
    return result;
  }, {});

  const exportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['activeOccupancy', String(kpis.activeOccupancy)],
      ['averageCycleTimeMinutes', String(kpis.averageCycleTimeMinutes)],
      ...Object.entries(statusCounts).map(([status, count]) => [`reservations_${status}`, String(count)]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'andesstay-reportes.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return <main className="min-h-screen bg-[#F5F6F8] p-6 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Reportería</h1><p className="text-xs text-gray-500 mt-1">Indicadores calculados por el servicio de reportes.</p></div><button type="button" onClick={exportCsv} className="bg-[#1A423B] text-white text-xs font-semibold px-4 py-2 rounded-lg">Exportar CSV</button></header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5"><Metric label="Ocupación activa" value={String(kpis.activeOccupancy)} detail="estadías activas" /><Metric label="Tiempo de ciclo" value={`${Math.round(kpis.averageCycleTimeMinutes)} min`} detail="promedio registrado" /><Metric label="Reservas" value={String(reservations.length)} detail="reservas disponibles en el servicio" /></div>
      <section className="bg-white rounded-xl border border-gray-200 p-6"><h2 className="text-sm font-bold text-gray-900">Reservas creadas por hora</h2><p className="text-xs text-gray-500 mt-1 mb-5">Valores recibidos desde reportes.</p>{hourlyEntries.length === 0 ? <PageMessage text="No hay eventos registrados." /> : <div className="space-y-3">{hourlyEntries.map(([hour, count]) => <div key={hour} className="flex justify-between text-xs border-b border-gray-100 pb-2"><span>{new Date(hour).toLocaleString('es-CL')}</span><strong>{count}</strong></div>)}</div>}</section>
      <section className="bg-white rounded-xl border border-gray-200 p-6"><h2 className="text-sm font-bold text-gray-900 mb-4">Reservas por estado</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Object.entries(statusCounts).map(([status, count]) => <div key={status} className="border border-gray-100 rounded-lg p-3"><p className="text-[10px] text-gray-500">{status}</p><p className="text-xl font-bold text-gray-900">{count}</p></div>)}</div></section>
    </div>
  </main>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="bg-white rounded-xl p-6 border border-gray-200"><p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p><p className="text-3xl font-bold text-gray-900 mt-3">{value}</p><p className="text-xs text-gray-500 mt-2">{detail}</p></div>; }
function Restricted() { return <PageMessage text="No tienes permisos para consultar reportería." />; }
function PageMessage({ text }: { text: string }) { return <main className="min-h-screen bg-[#F5F6F8] p-8 font-sans"><p className="max-w-7xl mx-auto text-sm text-gray-500">{text}</p></main>; }
