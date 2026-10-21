import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { getActiveOccupancy, getReservations, type ReservationResponse } from '../services/reservationService';
import {
  fetchReportKpis,
  fetchReportRows,
  parseReportEvent,
  type ReportKpis,
  type ReportRow,
  type ReservationReportEvent,
} from '../services/reportService';

type TimeRange = 'last24h' | 'last7d' | 'last30d';

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string; hours: number }> = [
  { value: 'last24h', label: 'Últimas 24 horas', hours: 24 },
  { value: 'last7d', label: 'Últimos 7 días', hours: 24 * 7 },
  { value: 'last30d', label: 'Últimos 30 días', hours: 24 * 30 },
];

interface UnitDto {
  unitId: number;
  name: string;
  city: string;
  type: string;
  rooms?: number;
  pricePerNight?: number;
  availability?: boolean;
}

interface ReportData {
  kpis: ReportKpis;
  activeOccupancy: number;
  rows: ReportRow[];
  reservations: ReservationResponse[];
  units: UnitDto[];
}

const formatCLP = (value: number) => `$${Math.round(Number(value) || 0).toLocaleString('es-CL')}`;

const formatHour = (date: Date) =>
  date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const formatClock = (date: Date) =>
  date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });

/**
 * ms-report serializa las horas como ZonedDateTime ("2026-10-15T17:00Z[Etc/UTC]").
 * El sufijo "[zona]" no es parseable por `new Date()`, así que lo removemos.
 */
const parseBucketKey = (key: string): Date => new Date(key.replace(/\[.*?\]$/, ''));

const formatDayHour = (date: Date) =>
  `${date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatHour(date)}`;

// Los buckets horarios de ms-report vienen en UTC del servidor; se muestran en UTC
// para mantener la misma convención de horas que el feed de eventos.
const formatDayHourUtc = (date: Date) =>
  `${date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })} · ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;

const formatRelative = (date: Date) => {
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'hace instantes';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  return `hace ${Math.floor(diffHours / 24)} d`;
};

const reservationRef = (event: ReservationReportEvent | null) =>
  event?.reservationId !== undefined && event?.reservationId !== null
    ? `AS-${event.reservationId}`
    : '—';

const describeActor = (actor?: string) => {
  if (!actor) return 'Sistema';
  const normalized = actor.trim().toUpperCase();
  if (normalized === 'SYSTEM_WEBPAY') return 'Sistema · Webpay';
  if (normalized === 'SYSTEM') return 'Sistema';
  if (normalized.startsWith('SYSTEM_')) {
    const suffix = normalized.slice('SYSTEM_'.length).replaceAll('_', ' ').toLowerCase();
    return `Sistema · ${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`;
  }
  return actor;
};

const unitTypeLabel = (type?: string) => {
  if (!type) return '—';
  const normalized = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (normalized === 'HABITACION') return 'Habitación';
  if (normalized === 'SUITE') return 'Suite';
  if (normalized === 'CABANA') return 'Cabaña';
  if (normalized === 'HOSTAL') return 'Hostal';
  if (normalized === 'LODGE') return 'Lodge';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export default function Reports() {
  const { isAdmin } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('last7d');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Control de Acceso (RBAC): Reportería es exclusiva del rol ADMIN
  // (coincide con la ruta protegida y con la política del BFF para /reports/**).
  const canViewReports = isAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [kpis, activeOccupancy, rows, reservations, unitsResponse] = await Promise.all([
        fetchReportKpis(),
        getActiveOccupancy(),
        fetchReportRows(),
        getReservations(),
        apiClient.get<UnitDto[] | { content: UnitDto[] }>(API_ENDPOINTS.catalog.list),
      ]);

      const rawUnits = Array.isArray(unitsResponse.data)
        ? unitsResponse.data
        : unitsResponse.data?.content ?? [];

      setData({ kpis, activeOccupancy, rows, reservations, units: rawUnits });
      setLastUpdated(new Date());
    } catch (caught) {
      if (isAxiosError(caught) && caught.response?.status === 403) {
        setForbidden(true);
      } else {
        setError('No se pudieron cargar los datos de reportería. Verifica que los servicios estén disponibles.');
        console.error('Error al cargar reportería:', caught);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rangeHours = RANGE_OPTIONS.find((option) => option.value === timeRange)?.hours ?? 24;
  const cutoff = useMemo(() => Date.now() - rangeHours * 60 * 60 * 1000, [rangeHours]);

  const analytics = useMemo(() => {
    if (!data) return null;

    const { kpis, activeOccupancy, rows, reservations, units } = data;

    // 1. Reservas por hora: buckets calculados por ms-report y filtrados por rango.
    const buckets = Object.entries(kpis.reservationsByHour ?? {})
      .map(([hour, count]) => ({ at: parseBucketKey(hour), count: Number(count) || 0 }))
      .filter((bucket) => !Number.isNaN(bucket.at.getTime()) && bucket.at.getTime() >= cutoff)
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    const totalInRange = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    const avgPerHour = buckets.length > 0 ? totalInRange / buckets.length : 0;
    const peakBucket = buckets.reduce<{ at: Date; count: number } | null>(
      (best, bucket) => (best === null || bucket.count > best.count ? bucket : best),
      null,
    );
    const maxBucketCount = buckets.reduce((max, bucket) => Math.max(max, bucket.count), 1);

    // 2. Tiempo de ciclo: promedio creación -> confirmación de las confirmaciones del rango.
    const events = rows
      .map(parseReportEvent)
      .filter((event): event is ReservationReportEvent => event !== null);

    const cycleSamples = events
      .filter(
        (event) =>
          event.eventType === 'RESERVATION_STATUS_UPDATED' &&
          event.status === 'CONFIRMADA' &&
          typeof event.timestamp === 'number' &&
          event.timestamp >= cutoff &&
          typeof event.createdAt === 'string' &&
          typeof event.updatedAt === 'string',
      )
      .map(
        (event) =>
          (new Date(event.updatedAt as string).getTime() - new Date(event.createdAt as string).getTime()) /
          60000,
      )
      .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

    const cycleMinutes =
      cycleSamples.length > 0
        ? cycleSamples.reduce((sum, minutes) => sum + minutes, 0) / cycleSamples.length
        : Number(kpis.averageCycleTimeMinutes) || 0;

    // 3. Ocupación activa: métrica de estado calculada desde ms-reservations.
    const totalUnits = units.length;
    const occupancyPct = totalUnits > 0 ? (activeOccupancy / totalUnits) * 100 : 0;

    // 4. Unidades más demandadas: cruce de reservas con el catálogo.
    const perUnit = new Map<string, { bookings: number; revenue: number }>();
    for (const reservation of reservations) {
      if (reservation.status === 'CANCELADA') continue;
      const key = String(reservation.unitId);
      const aggregate = perUnit.get(key) ?? { bookings: 0, revenue: 0 };
      aggregate.bookings += 1;
      aggregate.revenue += Number(reservation.totalAmount) || 0;
      perUnit.set(key, aggregate);
    }

    const unitsById = new Map(units.map((unit) => [String(unit.unitId), unit]));
    const topUnits = [...perUnit.entries()]
      .map(([unitId, aggregate]) => {
        const unit = unitsById.get(unitId);
        return {
          unitId,
          name: unit?.name ?? `Unidad #${unitId}`,
          city: unit?.city ?? '—',
          type: unit?.type,
          bookings: aggregate.bookings,
          revenue: aggregate.revenue,
        };
      })
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 8);

    const maxBookings = topUnits.length > 0 ? topUnits[0].bookings : 0;

    // 5. Feed de eventos recientes (lo consumido desde Kafka y almacenado por ms-report).
    const recentEvents = [...rows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      buckets,
      maxBucketCount,
      totalInRange,
      avgPerHour,
      peakBucket,
      cycleMinutes,
      cycleSamplesCount: cycleSamples.length,
      activeOccupancy,
      totalUnits,
      occupancyPct,
      topUnits,
      maxBookings,
      recentEvents,
    };
  }, [data, cutoff]);

  if (!canViewReports) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            No posees los permisos requeridos para acceder al panel de reportería y métricas consolidadas.
          </p>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl border border-amber-100 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Sin permisos en el servicio</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            El servicio de reportería rechazó la solicitud (403). El backend restringe <code>/reports</code> al rol
            ADMIN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">

        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Reportería & Analítica
              </h1>
              <span
                title="Eventos de reservas consumidos desde Kafka (reservations.events) y agregados por ms-report"
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  error
                    ? 'bg-gray-50 text-gray-500 border-gray-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    error ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'
                  }`}
                ></span>
                Kafka Live Stream
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Indicadores clave procesados mediante agregaciones en tiempo real para la toma de decisiones.
              {lastUpdated && (
                <span className="text-gray-400"> · Actualizado {formatClock(lastUpdated)} hrs</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-white border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1A423B] cursor-pointer"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Aviso de error (con datos previos aún visibles) */}
        {error && data && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-xs font-bold underline underline-offset-2 hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Primera carga */}
        {loading && !data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs animate-pulse">
                  <div className="h-2.5 w-32 bg-gray-100 rounded-full mb-5"></div>
                  <div className="h-8 w-24 bg-gray-100 rounded-lg mb-3"></div>
                  <div className="h-2.5 w-40 bg-gray-100 rounded-full"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs animate-pulse h-72"></div>
          </div>
        )}

        {/* Error sin datos */}
        {error && !data && !loading && (
          <div className="bg-white rounded-xl border border-red-100 p-8 text-center shadow-2xs">
            <p className="text-sm font-semibold text-gray-900 mb-1">No se pudo cargar la reportería</p>
            <p className="text-xs text-gray-500 mb-5">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="bg-[#1A423B] hover:bg-[#13332d] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {data && analytics && (
          <>
            {/* Tarjetas de Métricas Core (KPIs reales de ms-report) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Reservas por Hora (Promedio)
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {analytics.totalInRange} en el rango
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 tracking-tight">
                    {analytics.avgPerHour.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">reservas/hora activa</span>
                </div>
                <div className="mt-4 flex items-end gap-1 h-10" aria-hidden="true">
                  {analytics.buckets.slice(-16).map((bucket, index) => (
                    <div
                      key={index}
                      title={`${formatDayHourUtc(bucket.at)} · ${bucket.count} reservas`}
                      className="flex-1 rounded-t bg-[#1A423B]/70 hover:bg-[#1A423B] transition-colors"
                      style={{ height: `${Math.max((bucket.count / analytics.maxBucketCount) * 100, 10)}%` }}
                    ></div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {analytics.peakBucket
                    ? `Pico: ${formatDayHourUtc(analytics.peakBucket.at)} · ${analytics.peakBucket.count} ${
                        analytics.peakBucket.count === 1 ? 'reserva' : 'reservas'
                      }`
                    : 'Sin reservas creadas en el rango seleccionado.'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Tiempo de Ciclo Promedio
                  </span>
                  {analytics.cycleSamplesCount > 0 ? (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        analytics.cycleMinutes <= 30
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-amber-600 bg-amber-50'
                      }`}
                    >
                      {analytics.cycleMinutes <= 30 ? 'Óptimo' : 'Revisar'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      Histórico
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 tracking-tight">
                    {analytics.cycleMinutes < 1 ? '<1 min' : `${Math.round(analytics.cycleMinutes)} min`}
                  </span>
                  <span className="text-xs text-gray-500">creación → confirmación</span>
                </div>
                <p className="text-xs text-gray-400 mt-6">
                  {analytics.cycleSamplesCount > 0
                    ? `Tiempo medio sobre ${analytics.cycleSamplesCount} ${
                        analytics.cycleSamplesCount === 1 ? 'confirmación' : 'confirmaciones'
                      } del rango seleccionado.`
                    : 'Sin confirmaciones en el rango; se muestra el promedio histórico global.'}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Tasa de Ocupación Activa
                  </span>
                  <span className="text-xs font-bold text-[#CB6D51] bg-[#CB6D51]/10 px-2 py-0.5 rounded-full">
                    Estado actual
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 tracking-tight">
                    {analytics.occupancyPct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {analytics.activeOccupancy} de {analytics.totalUnits} unidades
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-6">
                  Reservas en estado EN_ESTADÍA según los eventos procesados por ms-report sobre el total de
                  unidades del catálogo (dato actual, no depende del rango).
                </p>
              </div>
            </div>

            {/* Unidades más demandadas + Feed de Kafka */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Unidades Más Demandadas</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Top alojamientos por volumen de reservas registradas (histórico)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#1A423B] bg-[#1A423B]/5 px-2.5 py-1 rounded-lg">
                    {analytics.topUnits.length} {analytics.topUnits.length === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Unidad</th>
                        <th className="px-6 py-3.5">Destino</th>
                        <th className="px-6 py-3.5">Tipo</th>
                        <th className="px-6 py-3.5">Reservas</th>
                        <th className="px-6 py-3.5">Demanda relativa</th>
                        {isAdmin && <th className="px-6 py-3.5 text-right">Ingresos</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {analytics.topUnits.length === 0 && (
                        <tr>
                          <td colSpan={isAdmin ? 6 : 5} className="px-6 py-10 text-center text-gray-400">
                            Todavía no hay reservas registradas para calcular la demanda.
                          </td>
                        </tr>
                      )}
                      {analytics.topUnits.map((unit) => {
                        const demandPct =
                          analytics.maxBookings > 0
                            ? Math.round((unit.bookings / analytics.maxBookings) * 100)
                            : 0;
                        return (
                          <tr key={unit.unitId} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{unit.name}</p>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">U{unit.unitId}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{unit.city}</td>
                            <td className="px-6 py-4">
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1A423B]/10 text-[#1A423B]">
                                {unitTypeLabel(unit.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700 font-medium">
                              {unit.bookings} {unit.bookings === 1 ? 'reserva' : 'reservas'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-[#CB6D51] h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${demandPct}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-gray-700">{demandPct}%</span>
                              </div>
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4 text-right font-bold text-gray-900">
                                {formatCLP(unit.revenue)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">Eventos Recientes</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Consumidos desde Kafka por ms-report
                  </p>
                </div>

                {analytics.recentEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10 px-6">
                    Todavía no se han recibido eventos de reservas.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {analytics.recentEvents.map((row) => {
                      const event = parseReportEvent(row);
                      const isCreated = event?.eventType === 'RESERVATION_CREATED';
                      const occurredAt = new Date(row.createdAt);
                      return (
                        <li key={row.id} className="px-6 py-3.5 flex items-start gap-3">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              isCreated ? 'bg-emerald-500' : 'bg-[#CB6D51]'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              Reserva {reservationRef(event)}{' '}
                              {isCreated
                                ? 'creada'
                                : event?.status
                                  ? `→ ${event.status}`
                                  : 'actualizada'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {describeActor(event?.actor)} ·{' '}
                              {Number.isNaN(occurredAt.getTime())
                                ? '—'
                                : formatDayHour(occurredAt)}
                            </p>
                          </div>
                          {!Number.isNaN(occurredAt.getTime()) && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                              {formatRelative(occurredAt)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
