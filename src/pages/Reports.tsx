import { useEffect, useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { getReportKpis, type ReportKpis } from '../services/reportService';
import { getReservations, type ReservationResponse } from '../services/reservationService';
import { getUnits, type Unit } from '../services/catalogService';
import { parseApiError } from '../utils/errorHandler';

export default function Reports() {
  const { isAdmin, isAuditor } = useUserRole();
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && !isAuditor) return;
    Promise.all([getReportKpis(), getReservations(), getUnits()])
      .then(([kpiData, reservationData, unitData]) => {
        setKpis(kpiData);
        setReservations(reservationData);
        setUnits(unitData);
      })
      .catch((loadError) => setError(parseApiError(loadError)));
  }, [isAdmin, isAuditor]);

  if (!isAdmin && !isAuditor) return <Restricted />;
  if (error) return <PageMessage text={error} />;
  if (!kpis) return <PageMessage text="Cargando datos de reportería..." />;

  const hourlyEntries = Object.entries(kpis.reservationsByHour);
  const timeOfDay = hourlyEntries.reduce<Record<string, number>>((result, [hour, count]) => {
    const hourNumber = new Date(hour).getHours();
    const period = hourNumber < 6 ? 'Madrugada' : hourNumber < 12 ? 'Mañana' : hourNumber < 18 ? 'Tarde' : 'Noche';
    result[period] = (result[period] ?? 0) + count;
    return result;
  }, {});
  const maxTimeOfDay = Math.max(...Object.values(timeOfDay), 1);
  const unitNames = new Map(units.map((unit) => [unit.unitId, unit.name]));
  const requestedUnits = Object.entries(reservations.reduce<Record<string, number>>((result, reservation) => {
    const key = String(reservation.unitId);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {})).sort(([, first], [, second]) => second - first).slice(0, 5);
  const statusCounts = reservations.reduce<Record<string, number>>((result, reservation) => {
    result[reservation.status] = (result[reservation.status] ?? 0) + 1;
    return result;
  }, {});

  const exportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['activeOccupancy', String(kpis.activeOccupancy)],
      ...Object.entries(statusCounts).map(([status, count]) => [`reservations_${status}`, String(count)]),
      ...requestedUnits.map(([unitId, count]) => [`unit_${unitId}_reservations`, String(count)]),
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><Metric label="Ocupación activa" value={String(kpis.activeOccupancy)} detail="estadías activas" /><Metric label="Reservas" value={String(reservations.length)} detail="reservas disponibles en el servicio" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <section className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-3"><h2 className="text-sm font-bold text-gray-900">Reservas por momento del día</h2><p className="text-xs text-gray-500 mt-1 mb-5">Agrupación de los eventos horarios registrados por reportes.</p>{hourlyEntries.length === 0 ? <EmptyState text="No hay eventos registrados." /> : <div className="space-y-4">{Object.entries(timeOfDay).map(([period, count]) => <div key={period}><div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{period}</span><strong>{count}</strong></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1A423B] rounded-full" style={{ width: `${(count / maxTimeOfDay) * 100}%` }} /></div></div>)}</div>}</section>
        <section className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2"><h2 className="text-sm font-bold text-gray-900">Unidades más solicitadas</h2><p className="text-xs text-gray-500 mt-1 mb-5">Ranking calculado desde las reservas registradas.</p>{requestedUnits.length === 0 ? <EmptyState text="No hay reservas para clasificar." /> : <div className="space-y-4">{requestedUnits.map(([unitId, count], index) => <div key={unitId} className="flex items-center gap-3"><span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 truncate">{unitNames.get(Number(unitId)) ?? `Unidad #${unitId}`}</p><div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden"><div className="h-full bg-[#CB6D51] rounded-full" style={{ width: `${(count / (requestedUnits[0]?.[1] ?? 1)) * 100}%` }} /></div></div><span className="text-xs font-bold text-gray-700">{count}</span></div>)}</div>}</section>
      </div>
      <section className="bg-white rounded-xl border border-gray-200 p-6"><h2 className="text-sm font-bold text-gray-900 mb-4">Reservas por estado</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Object.entries(statusCounts).map(([status, count]) => <div key={status} className="border border-gray-100 rounded-lg p-3"><p className="text-[10px] text-gray-500">{status}</p><p className="text-xl font-bold text-gray-900">{count}</p></div>)}</div></section>
    </div>
  </main>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="bg-white rounded-xl p-6 border border-gray-200"><p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p><p className="text-3xl font-bold text-gray-900 mt-3">{value}</p><p className="text-xs text-gray-500 mt-2">{detail}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="py-8 text-xs text-gray-400">{text}</div>; }
function Restricted() { return <PageMessage text="No tienes permisos para consultar reportería." />; }
function PageMessage({ text }: { text: string }) { return <main className="min-h-screen bg-[#F5F6F8] p-8 font-sans"><p className="max-w-7xl mx-auto text-sm text-gray-500">{text}</p></main>; }
