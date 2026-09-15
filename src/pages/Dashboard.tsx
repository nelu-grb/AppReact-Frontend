import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { getUnits, type Unit } from '../services/catalogService';
import { getReservations, type ReservationResponse } from '../services/reservationService';
import { getReportKpis, type ReportKpis } from '../services/reportService';
import { getAuditEvents, type AuditEvent } from '../services/auditService';
import { parseApiError } from '../utils/errorHandler';

const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('es-CL');
const formatDateTime = (value: string) => new Date(value).toLocaleString('es-CL');
const formatHour = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString('es-CL');
  if (/^\d{1,2}:\d{2}/.test(value)) return value;
  if (/^\d{1,2}$/.test(value)) return `${value.padStart(2, '0')}:00`;
  return value;
};

export default function Dashboard() {
  const { fullName, email, isAdmin, isRecepcionista, isHuesped, isAuditor } = useUserRole();
  const [units, setUnits] = useState<Unit[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const reservationPromise = getReservations();
        const unitPromise = isAdmin || isRecepcionista ? getUnits() : Promise.resolve([] as Unit[]);
        const kpiPromise = isAdmin ? getReportKpis() : Promise.resolve(null);
        const auditPromise = isAdmin || isAuditor ? getAuditEvents() : Promise.resolve([] as AuditEvent[]);
        const [reservationData, unitData, kpiData, auditData] = await Promise.all([
          reservationPromise, unitPromise, kpiPromise, auditPromise,
        ]);
        setReservations(reservationData);
        setUnits(unitData);
        setKpis(kpiData);
        setAuditEvents(auditData);
      } catch (loadError) {
        setError(parseApiError(loadError));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin, isAuditor, isRecepcionista]);

  const roleLabel = isAdmin ? 'Admin' : isRecepcionista ? 'Recepcionista' : isAuditor ? 'Auditor' : 'Huésped';

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F4F6F6] font-sans">
      <Header fullName={fullName} roleLabel={roleLabel} />
      {loading && <p className="text-sm text-gray-500">Cargando datos del sistema...</p>}
      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
      {!loading && !error && isAdmin && <AdminView units={units} reservations={reservations} kpis={kpis} auditEvents={auditEvents} />}
      {!loading && !error && isRecepcionista && <ReceptionView units={units} reservations={reservations} />}
      {!loading && !error && isHuesped && <GuestView reservations={reservations} email={email} fullName={fullName} />}
      {!loading && !error && isAuditor && !isAdmin && <AuditorView auditEvents={auditEvents} />}
    </div>
  );
}

function Header({ fullName, roleLabel }: { fullName: string; roleLabel: string }) {
  return <div className="mb-6 flex items-center justify-between gap-4"><div><h1 className="text-xl font-bold text-gray-900 tracking-tight">Panel de Control - {fullName}</h1><p className="text-xs text-gray-500 mt-0.5">Información operativa según tu rol.</p></div><span className="text-xs font-bold px-3 py-1.5 bg-[#1A423B] text-white rounded-lg shadow-2xs">Rol: {roleLabel}</span></div>;
}

function AdminView({ units, reservations, kpis, auditEvents }: { units: Unit[]; reservations: ReservationResponse[]; kpis: ReportKpis | null; auditEvents: AuditEvent[] }) {
  const pending = reservations.filter((item) => item.status === 'CREADA').length;
  const available = units.filter((unit) => unit.availability).length;
  const occupancy = units.length && kpis ? Math.round((kpis.activeOccupancy / units.length) * 100) : 0;
  const hourly = kpis ? Object.entries(kpis.reservationsByHour) : [];
  const recent = auditEvents.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  const statuses = countStatuses(reservations);

  return <><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6"><MetricCard label="Ocupación activa" value={`${occupancy}%`} detail={`${kpis?.activeOccupancy ?? 0} estadías de ${units.length} unidades`} dark /><MetricCard label="Unidades disponibles" value={String(available)} detail={`de ${units.length} en catálogo`} /><MetricCard label="Reservas creadas" value={String(reservations.length)} detail={`${pending} pendientes de confirmar`} /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Panel title="Reservas por hora" subtitle="Eventos procesados por reportes">{hourly.length ? hourly.map(([hour, count]) => <Row key={hour} label={formatHour(hour)} value={String(count)} />) : <EmptyState text="No hay eventos registrados." />}</Panel><Panel title="Estado de reservas" subtitle="Conteo del servicio de reservas">{statuses.length ? statuses.map(([status, count]) => <Row key={status} label={status} value={String(count)} />) : <EmptyState text="No hay reservas registradas." />}</Panel></div><div className="mt-6"><Panel title="Actividad reciente" subtitle="Eventos recibidos por auditoría">{recent.length ? recent.map((event) => <Row key={event.id} label={`${event.eventType} - ${event.actor || 'Sin actor'}`} value={formatDateTime(event.timestamp)} />) : <EmptyState text="No hay eventos auditados." />}</Panel></div></>;
}

function ReceptionView({ units, reservations }: { units: Unit[]; reservations: ReservationResponse[] }) {
  const currentDay = today();
  const arrivals = reservations.filter((item) => item.startDate === currentDay && item.status !== 'CANCELADA');
  const departures = reservations.filter((item) => item.endDate === currentDay && item.status !== 'CANCELADA');
  return <><div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6"><MetricCard label="Llegadas hoy" value={String(arrivals.length)} detail="reservas con entrada hoy" dark /><MetricCard label="Salidas hoy" value={String(departures.length)} detail="reservas con salida hoy" /><MetricCard label="Unidades disponibles" value={String(units.filter((unit) => unit.availability).length)} detail={`de ${units.length} en catálogo`} /></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ReservationPanel title="Llegadas de hoy" items={arrivals} empty="No hay llegadas para hoy." /><ReservationPanel title="Salidas de hoy" items={departures} empty="No hay salidas para hoy." /></div><Link to="/reservations" className="inline-block mt-6 text-xs font-semibold text-[#1A423B]">Gestionar reservas →</Link></>;
}

function GuestView({ reservations, email, fullName }: { reservations: ReservationResponse[]; email: string; fullName: string }) {
  const own = reservations.filter((item) => item.guestEmail?.toLowerCase() === email.toLowerCase() || item.guestId?.toLowerCase() === fullName.toLowerCase());
  return <><div className="bg-[#1A423B] rounded-xl p-6 text-white mb-6"><h2 className="text-lg font-bold">Hola, {fullName}</h2><p className="text-xs text-emerald-100 mt-1">Aquí puedes consultar tus reservas y sus estados actuales.</p></div><Panel title="Mis reservas" subtitle="Información proveniente del servicio de reservas">{own.length ? own.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 text-xs"><div><p className="font-bold text-gray-900">Reserva #{item.id}</p><p className="text-gray-500">{dateLabel(item.startDate)} - {dateLabel(item.endDate)}</p></div><span className="font-bold text-[#1A423B]">{item.status}</span></div>) : <EmptyState text="No hay reservas asociadas a tu cuenta." />}</Panel><Link to="/reservations" className="inline-block mt-6 text-xs font-semibold text-[#1A423B]">Ver reservas →</Link></>;
}

function AuditorView({ auditEvents }: { auditEvents: AuditEvent[] }) { return <Panel title="Actividad auditada" subtitle="Vista de solo lectura">{auditEvents.length ? auditEvents.slice(0, 8).map((event) => <Row key={event.id} label={`${event.eventType} - ${event.actor || 'Sin actor'}`} value={formatDateTime(event.timestamp)} />) : <EmptyState text="No hay eventos auditados." />}</Panel>; }
function ReservationPanel({ title, items, empty }: { title: string; items: ReservationResponse[]; empty: string }) { return <Panel title={title} subtitle="Reservas registradas"><>{items.length ? items.map((item) => <Row key={item.id} label={`${item.guestId} - Unidad #${item.unitId}`} value={item.status} />) : <EmptyState text={empty} />}</></Panel>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <section className="bg-white border border-gray-200/90 rounded-xl p-6 shadow-2xs"><h3 className="font-bold text-gray-900 text-sm">{title}</h3><p className="text-xs text-gray-500 mt-1 mb-4">{subtitle}</p>{children}</section>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 text-xs"><span className="text-gray-700">{label}</span><strong className="text-gray-900 text-right">{value}</strong></div>; }
function MetricCard({ label, value, detail, dark = false }: { label: string; value: string; detail: string; dark?: boolean }) { return <div className={`${dark ? 'bg-[#1A423B] text-white' : 'bg-white text-gray-900 border border-gray-200/90'} rounded-xl p-5 shadow-2xs`}><h3 className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-emerald-200' : 'text-gray-400'}`}>{label}</h3><div className="my-2"><span className="text-3xl font-extrabold tracking-tight">{value}</span></div><p className={`text-xs ${dark ? 'text-emerald-100/80' : 'text-gray-500'}`}>{detail}</p></div>; }
function EmptyState({ text }: { text: string }) { return <p className="py-4 text-xs text-gray-400">{text}</p>; }
function countStatuses(items: ReservationResponse[]) { const counts = items.reduce<Record<string, number>>((result, item) => { result[item.status] = (result[item.status] ?? 0) + 1; return result; }, {}); return Object.entries(counts); }
