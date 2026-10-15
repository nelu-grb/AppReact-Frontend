import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { fetchAuditEvents, type AuditEvent } from '../services/auditService';

interface MonthlyReservationPoint {
  monthKey: string;
  label: string;
  count: number;
  percentage: number;
}

interface DashboardReservation {
  id?: number | string;
  code?: string;
  guestId?: string;
  guestName?: string;
  unitId?: number | string;
  alojamientoId?: number | string;
  unit?: { id?: number | string; unitId?: number | string; name?: string };
  unitName?: string;
  status?: string;
  estado?: string;
  startDate?: string;
  checkInDate?: string;
  endDate?: string;
  checkOutDate?: string;
}

interface DashboardUnit {
  id?: number | string;
  unitId?: number | string;
  name?: string;
}

const normalizeStatus = (status?: string) =>
  status ? status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase() : '';

const getDateKey = (value?: string) => {
  if (!value) return null;
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
  if (!dateOnly) return null;
  const parsedDate = new Date(`${dateOnly}T00:00:00Z`);
  return Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateOnly
    ? null
    : dateOnly;
};

const getReservationTimestamp = (value?: string) => {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const localizedDateTime = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : localizedDateTime
      ? new Date(
        Number(localizedDateTime[3]),
        Number(localizedDateTime[2]) - 1,
        Number(localizedDateTime[1]),
        Number(localizedDateTime[4] ?? 0),
        Number(localizedDateTime[5] ?? 0)
      )
      : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatReservationDate = (value?: string) => {
  const timestamp = getReservationTimestamp(value);
  if (timestamp === null) return 'Fecha no disponible';
  const hasTime = Boolean(value && /(?:T|\s)\d{2}:\d{2}/.test(value));
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(timestamp));
};

const formatActivityDate = (value?: string) => {
  const timestamp = getReservationTimestamp(value);
  if (timestamp === null) return value || 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const getReservationRecords = (data: unknown): DashboardReservation[] => {
  if (Array.isArray(data)) return data as DashboardReservation[];
  if (data && typeof data === 'object' && 'content' in data && Array.isArray(data.content)) {
    return data.content as DashboardReservation[];
  }
  return [];
};

const getCatalogRecords = (data: unknown): DashboardUnit[] => {
  if (Array.isArray(data)) return data as DashboardUnit[];
  if (data && typeof data === 'object' && 'content' in data && Array.isArray(data.content)) {
    return data.content as DashboardUnit[];
  }
  return [];
};

const scheduledReservationStatuses = new Set([
  'CONFIRMADA',
  'CHECKIN_PENDIENTE',
]);

export default function Dashboard() {
  const { fullName, primaryRole, isAdmin, isRecepcionista, isHuesped } = useAuth();

  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [units, setUnits] = useState<DashboardUnit[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditEvent[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      const reservationsRequest = apiClient
        .get<unknown>(API_ENDPOINTS.reservations.list)
        .then((response) => {
          if (isMounted) setReservations(getReservationRecords(response.data));
        })
        .catch((error: unknown) => {
          console.error('Error al cargar reservas para el dashboard:', error);
          if (isMounted) {
            setReservations([]);
            setReservationsError(true);
          }
        })
        .finally(() => {
          if (isMounted) setReservationsLoading(false);
        });

      const catalogRequest = apiClient
        .get<unknown>(API_ENDPOINTS.catalog.list)
        .then((response) => {
          if (isMounted) setUnits(getCatalogRecords(response.data));
        })
        .catch((error: unknown) => {
          console.error('Error al cargar alojamientos para el dashboard:', error);
          if (isMounted) setUnits([]);
        });

      const isGuest = isHuesped || primaryRole === 'HUÉSPED';
      const activityRequest = isGuest
        ? Promise.resolve().then(() => {
          if (isMounted) setActivityLoading(false);
        })
        : fetchAuditEvents()
        .then((activity) => {
          if (isMounted) {
            activity.sort((a, b) =>
              (getReservationTimestamp(b.timestamp) ?? -Infinity) -
              (getReservationTimestamp(a.timestamp) ?? -Infinity)
            );
            setRecentActivity(activity.slice(0, 8));
          }
        })
        .catch((error: unknown) => {
          console.error('Error al cargar actividad reciente:', error);
          if (isMounted) {
            setRecentActivity([]);
            setActivityError(true);
          }
        })
        .finally(() => {
          if (isMounted) setActivityLoading(false);
        });

      await Promise.all([reservationsRequest, catalogRequest, activityRequest]);
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [primaryRole, isHuesped]);

  const monthlyReservations = useMemo<MonthlyReservationPoint[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      return {
        monthKey,
        label: new Intl.DateTimeFormat('es-CL', { month: 'short' })
          .format(monthDate)
          .replace('.', ''),
        count: 0,
        percentage: 0,
      };
    });
    const monthByKey = new Map(months.map((month) => [month.monthKey, month]));

    reservations.forEach((reservation) => {
      if (normalizeStatus(reservation.status ?? reservation.estado) === 'CANCELADA') return;
      const checkInDate = getDateKey(reservation.startDate ?? reservation.checkInDate);
      if (!checkInDate) return;
      const month = monthByKey.get(checkInDate.slice(0, 7));
      if (month) month.count += 1;
    });

    const total = months.reduce((sum, month) => sum + month.count, 0);
    months.forEach((month) => {
      month.percentage = total ? Math.round((month.count / total) * 100) : 0;
    });
    return months;
  }, [reservations]);
  const maxMonthlyPercentage = Math.max(1, ...monthlyReservations.map((month) => month.percentage));

  const upcomingReservations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reservations
      .filter((reservation) => scheduledReservationStatuses.has(
        normalizeStatus(reservation.status ?? reservation.estado)
      ))
      .map((reservation) => ({
        ...reservation,
        checkInTimestamp: getReservationTimestamp(reservation.startDate ?? reservation.checkInDate),
      }))
      .filter((reservation) => reservation.checkInTimestamp !== null && reservation.checkInTimestamp >= today.getTime())
      .sort((a, b) => a.checkInTimestamp! - b.checkInTimestamp!)
      .slice(0, 8);
  }, [reservations]);
  const nextGuestReservation = upcomingReservations[0];

  const getUnitName = (reservation: DashboardReservation) => {
    const unitId = reservation.unitId ?? reservation.alojamientoId ?? reservation.unit?.unitId ?? reservation.unit?.id;
    const catalogUnit = units.find((unit) =>
      String(unit.unitId ?? unit.id) === String(unitId ?? '')
    );
    return reservation.unitName || reservation.unit?.name || catalogUnit?.name ||
      (unitId !== undefined ? `Unidad #${unitId}` : 'Alojamiento no informado');
  };

  if (isHuesped) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F4F6F9] p-5 font-sans md:p-8 xl:p-10">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-9">
            <div className="relative z-10">
              <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                ¡Hola, {fullName || 'Huésped'}! 👋
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-gray-500">
                Bienvenido a tu panel de AndesStay. Gestiona tus estadías activas o explora nuevas
                propiedades disponibles para tus próximas vacaciones.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/reservations"
                  className="rounded-xl bg-[#0070F3] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow active:translate-y-0"
                >
                  Mis Reservas
                </Link>
                <Link
                  to="/catalog"
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-xs transition-all duration-200 hover:bg-gray-50"
                >
                  Explorar Catálogo
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="mb-4 text-base font-semibold text-gray-900">Próxima Estadía</h2>
              <div className="rounded-xl border border-blue-100 bg-[#EBF3FF] p-4">
                {reservationsLoading ? (
                  <p className="text-xs text-gray-500">Cargando tu próxima estadía…</p>
                ) : reservationsError ? (
                  <p className="text-xs text-gray-500">No se pudieron cargar tus reservas.</p>
                ) : nextGuestReservation ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0070F3]">
                      {nextGuestReservation.status ?? nextGuestReservation.estado ?? 'Reserva'}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{getUnitName(nextGuestReservation)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Check-in: {formatReservationDate(nextGuestReservation.startDate ?? nextGuestReservation.checkInDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">No tienes próximas reservas confirmadas.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <h2 className="mb-1 text-base font-semibold text-gray-900">Soporte al Huésped</h2>
                <p className="text-xs text-gray-500">
                  ¿Necesitas ayuda adicional con tus fechas o equipaje?
                </p>
              </div>
              <a
                href="https://wa.me/56900000000"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0070F3] transition-colors hover:text-blue-700"
              >
                Contactar con Recepción vía WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F9] p-5 font-sans text-gray-800 md:p-8 xl:p-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
            Panel de Control — {fullName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin && 'Vista Administrador: Consolidado general y rendimiento operacional de AndesStay.'}
            {isRecepcionista && 'Vista Recepción: Gestión en tiempo real de entradas, salidas y limpieza.'}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Reservas por mes</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Check-in de reservas no canceladas · últimos 6 meses
              </p>
            </div>
          </div>

          <div className="flex h-56 items-end justify-between gap-2 border-b border-gray-100 pb-2 pt-4">
            {reservationsLoading ? (
              <div className="flex h-full w-full items-end gap-2 animate-pulse">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-3/4 w-full rounded-t-sm bg-blue-50" />
                ))}
              </div>
            ) : (
              monthlyReservations.map((month) => (
                <div
                  key={month.monthKey}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  title={`${month.count} reservas · ${month.percentage}% del total del período`}
                >
                  <span className="whitespace-nowrap text-[10px] font-semibold text-gray-600">
                    {month.count} · {month.percentage}%
                  </span>
                  <div className="flex h-36 w-full items-end justify-center">
                    <div
                      className="w-1/2 rounded-t-md bg-[#0070F3] transition-all duration-500"
                      style={{
                        height: `${(month.percentage / maxMonthlyPercentage) * 100}%`,
                        minHeight: month.count > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <span className="capitalize font-mono text-[10px] text-gray-400">{month.label}</span>
                </div>
              ))
            )}
          </div>
          {!reservationsLoading && monthlyReservations.every((month) => month.count === 0) && (
            <p className="mt-3 text-center text-xs text-gray-400">
              No hay reservas con check-in en los últimos 6 meses
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-900">Próximas reservas</h3>
            <p className="mt-0.5 text-xs text-gray-500">Ordenadas por fecha de check-in</p>
          </div>

          <div className="space-y-4">
            {reservationsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-6 w-full rounded-md bg-gray-100" />
                ))}
              </div>
            ) : reservationsError ? (
              <p className="py-6 text-center text-xs text-gray-400">No se pudieron cargar las reservas</p>
            ) : upcomingReservations.length > 0 ? (
              upcomingReservations.map((reservation, index) => {
                const date = reservation.startDate ?? reservation.checkInDate;
                const hasTime = Boolean(date && /(?:T|\s)\d{2}:\d{2}/.test(date));
                return (
                  <div
                    key={reservation.id ?? reservation.code ?? `${date}-${index}`}
                    className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">
                        {reservation.guestName ?? reservation.guestId ?? '—'}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-gray-500">
                        {reservation.code ? `${reservation.code} · ` : ''}{getUnitName(reservation)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-gray-700">{formatReservationDate(date)}</p>
                      {!hasTime && <p className="mt-0.5 text-[10px] text-gray-400">Hora no informada</p>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-xs text-gray-400">No hay próximas reservas confirmadas</p>
            )}
          </div>
          {!reservationsLoading && upcomingReservations.length > 0 && (
            <Link
              to="/reservations"
              className="mt-4 block border-t border-gray-100 pt-3 text-center text-xs font-semibold text-[#0070F3] transition-colors hover:text-blue-700"
            >
              Ver todas las reservas →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">Actividad reciente</h3>
          <p className="mt-0.5 text-xs text-gray-500">Últimos eventos ordenados del más reciente al más antiguo</p>
        </div>

        <div className="space-y-3.5">
          {activityLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-8 w-full rounded-md bg-gray-100" />
              ))}
            </div>
          ) : activityError ? (
            <p className="py-6 text-center text-xs text-gray-400">No se pudo cargar la actividad reciente</p>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => {
              const timestamp = activity.timestamp;
              return (
                <div
                  key={activity.id || `${timestamp}-${index}`}
                  className="flex items-start gap-2.5 rounded-lg border-b border-gray-100 p-2 text-xs last:border-0"
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0070F3]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800">
                      <span className="font-semibold text-gray-900">{activity.user || '—'}</span>
                      {activity.action && ` · ${activity.action}`}
                      {activity.reservationId && (
                        <> · <span className="font-mono font-semibold text-gray-600">{activity.reservationId}</span></>
                      )}
                    </p>
                    {activity.details && <p className="mt-0.5 text-gray-600">{activity.details}</p>}
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {formatActivityDate(timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-xs text-gray-400">No hay actividad reciente registrada</p>
          )}
        </div>
        {!activityLoading && !activityError && recentActivity.length > 0 && (
          <Link
            to="/audit"
            className="mt-4 block border-t border-gray-100 pt-3 text-center text-xs font-semibold text-[#0070F3] transition-colors hover:text-blue-700"
          >
            Ver auditoría completa →
          </Link>
        )}
      </div>
    </div>
  );
}
