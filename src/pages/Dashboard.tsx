import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { getUnits, type Unit } from '../services/catalogService';
import { getReservations, type ReservationResponse } from '../services/reservationService';
import { getReportKpis, type ReportKpis } from '../services/reportService';
import { getAuditEvents, type AuditEvent } from '../services/auditService';
import { parseApiError } from '../utils/errorHandler';

const formatDate = (value: string) => new Date(value).toLocaleString('es-CL');

export default function Dashboard() {
  const { fullName, isAdmin, isRecepcionista, isHuesped, isAuditor } = useUserRole();
  const [units, setUnits] = useState<Unit[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [unitData, reservationData, kpiData, auditData] = await Promise.all([
          getUnits(), getReservations(), getReportKpis(), getAuditEvents(),
        ]);
        setUnits(unitData);
        setReservations(reservationData);
        setKpis(kpiData);
        setAuditEvents(auditData);
      } catch (loadError) {
        setError(parseApiError(loadError));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const pendingReservations = reservations.filter((item) => item.status === 'CREADA').length;
  const availableUnits = units.filter((unit) => unit.availability).length;
  const occupancyPercent = units.length && kpis
    ? Math.round((kpis.activeOccupancy / units.length) * 100)
    : 0;
  const statusData = useMemo(() => {
    const counts = reservations.reduce<Record<string, number>>((result, reservation) => {
      result[reservation.status] = (result[reservation.status] ?? 0) + 1;
      return result;
    }, {});
    return Object.entries(counts);
  }, [reservations]);
  const hourlyData = useMemo(() => kpis
    ? Object.entries(kpis.reservationsByHour).sort(([first], [second]) => first.localeCompare(second))
    : [], [kpis]);
  const maxHourlyCount = Math.max(...hourlyData.map(([, count]) => count), 1);
  const recentEvents = auditEvents.slice().sort((first, second) =>
    new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
  ).slice(0, 5);
  const roleLabel = isAdmin ? 'Admin' : isRecepcionista ? 'Recepcionista' : isAuditor ? 'Auditor' : 'Huésped';

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F4F6F6] font-sans">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Panel de Control — {fullName}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Información disponible desde catálogo, reservas, reportes y auditoría.</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 bg-[#1A423B] text-white rounded-lg shadow-2xs">Rol: {roleLabel}</span>
      </div>

      {loading && <p className="text-sm text-gray-500">Cargando datos del sistema...</p>}
      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}

      {!loading && !error && <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <MetricCard label="Ocupación activa" value={`${occupancyPercent}%`} detail={`${kpis?.activeOccupancy ?? 0} estadías activas de ${units.length} unidades`} dark />
          <MetricCard label="Unidades disponibles" value={String(availableUnits)} detail={`de ${units.length} unidades en catálogo`} />
          <MetricCard label="Reservas creadas" value={String(reservations.length)} detail={`${pendingReservations} pendientes de confirmar`} />
          <MetricCard label="Tiempo promedio" value={`${Math.round(kpis?.averageCycleTimeMinutes ?? 0)} min`} detail="ciclo promedio registrado por reportes" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <section className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs lg:col-span-2">
            <h3 className="font-bold text-gray-900 text-sm">Reservas creadas por hora</h3>
            <p className="text-xs text-gray-500 mb-6">Datos recibidos desde el servicio de reportes</p>
            {hourlyData.length === 0 ? <EmptyState text="No hay eventos de reservas registrados." /> : <div className="h-44 flex items-end gap-2">
              {hourlyData.map(([hour, count]) => <div key={hour} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-gray-700">{count}</span>
                <div className="w-full bg-[#1A423B]/70 rounded-t-sm" style={{ height: `${Math.max((count / maxHourlyCount) * 100, 4)}%` }} />
                <span className="text-[9px] text-gray-400 truncate w-full text-center">{new Date(hour).toLocaleTimeString('es-CL', { hour: '2-digit' })}</span>
              </div>)}
            </div>}
          </section>

          <section className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Estado de reservas</h3>
            <p className="text-xs text-gray-500 mb-6">Conteo real del servicio de reservas</p>
            <div className="space-y-4">{statusData.length === 0 ? <EmptyState text="No hay reservas registradas." /> : statusData.map(([status, count]) => <div key={status} className="flex items-center justify-between text-xs"><span className="text-gray-600 font-medium">{status}</span><span className="font-bold text-gray-900">{count}</span></div>)}</div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs lg:col-span-2">
            <div className="flex justify-between items-center mb-5"><div><h3 className="font-bold text-gray-900 text-sm">Unidades del catálogo</h3><p className="text-xs text-gray-500">Disponibilidad reportada por catálogo</p></div><Link to="/catalog" className="text-xs font-semibold text-[#1A423B]">Ver catálogo</Link></div>
            <div className="space-y-4">{units.length === 0 ? <EmptyState text="No hay unidades en catálogo." /> : units.slice(0, 6).map((unit) => <div key={unit.unitId} className="flex items-center text-xs"><div className="w-44 shrink-0"><p className="font-bold text-gray-900">{unit.name}</p><p className="text-[10px] text-gray-400">{unit.city}</p></div><div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${unit.availability ? 'bg-emerald-500' : 'bg-gray-400'}`} style={{ width: unit.availability ? '100%' : '20%' }} /></div><span className="text-[10px] font-bold text-gray-600">{unit.availability ? 'Disponible' : 'No disponible'}</span></div>)}</div>
          </section>

          <section className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Actividad reciente</h3><p className="text-xs text-gray-500 mb-5">Eventos recibidos por auditoría</p>
            {recentEvents.length === 0 ? <EmptyState text="No hay eventos auditados." /> : <ul className="space-y-3.5">{recentEvents.map((event) => <li key={event.id} className="flex gap-2.5 text-xs"><div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#CB6D51]" /><div><p className="font-semibold text-gray-900">{event.eventType}</p><p className="text-[10px] text-gray-400 mt-0.5">{event.actor || 'Sin actor'} · {formatDate(event.timestamp)}</p></div></li>)}</ul>}
          </section>
        </div>

        {(isRecepcionista || isAdmin || isHuesped) && <Link to="/reservations" className="inline-block mt-6 text-xs font-semibold text-[#1A423B]">Ver reservas →</Link>}
      </>}
    </div>
  );
}

function MetricCard({ label, value, detail, dark = false }: { label: string; value: string; detail: string; dark?: boolean }) {
  return <div className={`${dark ? 'bg-[#1A423B] text-white' : 'bg-white text-gray-900 border border-gray-200/90'} rounded-xl p-5 shadow-2xs`}><h3 className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-emerald-200' : 'text-gray-400'}`}>{label}</h3><div className="my-2"><span className="text-3xl font-extrabold tracking-tight">{value}</span></div><p className={`text-xs ${dark ? 'text-emerald-100/80' : 'text-gray-500'}`}>{detail}</p></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-gray-400">{text}</p>;
}
