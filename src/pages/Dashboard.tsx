import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { formatCLP } from '../utils/formatters';

type DashboardRange = 'hoy' | 'semana' | 'mes';

interface ChartPoint {
  time: string;
  value: number;
  isPeak?: boolean;
}

interface ChannelStat {
  name: string;
  count: number;
  percent: string;
}

interface PropertyOccupancy {
  name: string;
  location: string;
  percent: number;
}

interface ActivityLog {
  user: string;
  action: string;
  res: string;
  time: string;
  prop: string;
  color?: string;
}

interface ReservationMetrics {
  hourlyDistribution?: ChartPoint[];
  channels?: ChannelStat[];
}

interface DashboardReservation {
  status?: string;
  estado?: string;
  totalAmount?: number | string | null;
  amount?: number | string | null;
}

interface CatalogUnit {
  id?: string | number;
}

interface ReportsKpis {
  activeOccupancy: number;
}

interface DashboardKpis {
  ocupacionRed: number;
  checkInsActivos: number;
  sinConfirmar: number;
  ingresosTotales: number;
}

const parseAmount = (amount: number | string | null | undefined): number => {
  if (typeof amount === 'number') {
    return Number.isFinite(amount) ? amount : 0;
  }

  const wholeAmount = Number.parseInt(String(amount ?? '').split('.')[0].replace(/\D/g, ''), 10);
  return Number.isFinite(wholeAmount) ? wholeAmount : 0;
};

const dashboardRanges = ['hoy', 'semana', 'mes'] as const;
const rangeLabels: Record<DashboardRange, string> = {
  hoy: 'Hoy',
  semana: 'Semana',
  mes: 'Mes',
};

export default function Dashboard() {
  const { fullName, primaryRole, isAdmin, isRecepcionista, isHuesped } = useAuth();
  const [activeRange, setActiveRange] = useState<DashboardRange>('hoy');
  const [hoveredBar, setHoveredBar] = useState<ChartPoint | null>(null);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [channelData, setChannelData] = useState<ChannelStat[]>([]);
  const [propertiesData, setPropertiesData] = useState<PropertyOccupancy[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKpis>({
    ocupacionRed: 0,
    checkInsActivos: 0,
    sinConfirmar: 0,
    ingresosTotales: 0,
  });

useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      // 1. CORTAFUEGOS: Si es huésped, cortamos la ejecución para que no vea métricas globales
      if (isHuesped || primaryRole === 'HUÉSPED') {
        setLoading(false);
        return;
      }

      setLoading(true);

      // ==========================================
      // BLOQUE 1: CÁLCULO DE KPIs (100% Reales)
      // ==========================================
      try {
        const [reservationsResponse, unitsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.reservations.list),
          apiClient.get(API_ENDPOINTS.catalog.list),
        ]);

        if (!isMounted) return;

        const reservations = Array.isArray(reservationsResponse.data) 
          ? reservationsResponse.data 
          : (reservationsResponse.data?.content || []);
          
        const units = Array.isArray(unitsResponse.data) 
          ? unitsResponse.data 
          : (unitsResponse.data?.content || []);

        const normalizeStatus = (status?: string) =>
          status ? status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() : '';

        // A. Check-ins Activos
        const activeOccupancy = reservations.filter((r: any) => 
          normalizeStatus(r.status ?? r.estado) === 'EN_ESTADIA'
        ).length;

        // B. Sin Confirmar
        const unconfirmedCount = reservations.filter((r: any) => 
          normalizeStatus(r.status ?? r.estado) === 'CREADA'
        ).length;

        // C. Ingresos Totales
        const totalRevenue = reservations.reduce((suma: number, r: any) => {
          const state = normalizeStatus(r.status ?? r.estado);
          if (state === 'CONFIRMADA' || state === 'EN_ESTADIA') {
             return suma + Number(r.totalAmount ?? r.amount ?? 0);
          }
          return suma;
        }, 0);

        // D. Ocupación Red (%)
        const porcentajeOcupacion = units.length > 0 
          ? Math.round((activeOccupancy / units.length) * 100) 
          : 0;

        setKpis({
          ocupacionRed: porcentajeOcupacion,
          checkInsActivos: activeOccupancy,
          sinConfirmar: unconfirmedCount,
          ingresosTotales: totalRevenue,
        });

      } catch (error) {
        console.error('Error al cargar KPIs de reservas:', error);
      }

      // ==========================================
      // BLOQUE 2: GRÁFICOS Y ACTIVIDAD
      // ==========================================
      try {
        // Usamos .catch() individual para evitar que un Error 500 rompa el Promise.all
        const [auditResponse, catalogResponse, metricsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.audit.list).catch(() => ({ data: [] })),
          apiClient.get('/catalog/occupancy').catch(() => ({ data: [] })),
          apiClient.get('/reservations/metrics').catch(() => ({ data: {} })),
        ]);

        if (!isMounted) return;

        setRecentActivity(Array.isArray(auditResponse.data) ? auditResponse.data : []);
        setPropertiesData(Array.isArray(catalogResponse.data) ? catalogResponse.data : []);
        setChartData(metricsResponse.data?.hourlyDistribution ?? []);
        setChannelData(metricsResponse.data?.channels ?? []);

      } catch (error) {
        console.error('Error al cargar gráficos:', error);
      } finally {
        if (isMounted) {
          setLoading(false); // Oculta el spinner general al terminar todo
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [primaryRole, isHuesped]);
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0070F3]">
                  Reserva Confirmada
                </span>
                <p className="mt-1 text-sm font-semibold text-gray-900">Cabaña Bosque Nativo #4 — Pucón</p>
                <p className="mt-1 text-xs text-gray-500">Check-in listo para coordinar en recepción.</p>
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

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-xs font-medium shadow-xs">
            {dashboardRanges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-all duration-200 ${
                  activeRange === range
                    ? 'bg-gray-100 font-semibold text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <span className="rounded-xl bg-[#0070F3] px-3.5 py-2 text-xs font-semibold text-white shadow-xs">
            Rol: {primaryRole}
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-5">
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ocupación Red</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold tracking-tight text-gray-900">
              {kpis.ocupacionRed}%
            </span>
          </div>
          <p className="text-xs text-gray-500">Calculada sobre el total de unidades del catálogo</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Check-ins Activos</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold tracking-tight text-gray-900">
              {kpis.checkInsActivos}
            </span>
          </div>
          <p className="text-xs text-gray-500">Huéspedes actualmente en tránsito</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sin Confirmar</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold tracking-tight text-gray-900">
              {kpis.sinConfirmar}
            </span>
          </div>
          <p className="text-xs text-gray-500">Pendientes de pago o revisión</p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ingresos Totales</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold tracking-tight text-gray-900">
              {formatCLP(kpis.ingresosTotales)}
            </span>
          </div>
          <p className="text-xs text-gray-500">Reservas confirmadas y estadías activas</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7 lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Distribución de reservas por hora</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Monitoreo de la demanda en el periodo seleccionado ({rangeLabels[activeRange]})
              </p>
            </div>
            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0070F3] animate-pulse">
              Pico 16 h — 11 reservas
            </span>
          </div>

          <div className="relative flex h-44 items-end justify-between gap-2 border-b border-gray-100 pb-2 pt-4">
            {loading ? (
              <div className="flex h-full w-full items-end gap-2 animate-pulse">
                {[40, 70, 30, 80, 50, 90, 60].map((height, index) => (
                  <div key={index} className="w-full rounded-t-sm bg-blue-50" style={{ height: `${height}%` }} />
                ))}
              </div>
            ) : chartData.length > 0 ? (
              chartData.map((data, index) => (
                <div
                  key={`${data.time}-${index}`}
                  className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-end"
                  onMouseEnter={() => setHoveredBar(data)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                      data.isPeak ? 'bg-[#0070F3]' : 'bg-[#EBF3FF] group-hover:bg-[#0070F3]/70'
                    }`}
                    style={{ height: `${data.value}%` }}
                  >
                    <div className="h-1 w-full rounded-t-md bg-[#0070F3]" />
                  </div>
                  <span className="mt-2 font-mono text-[10px] text-gray-400">{data.time}</span>
                </div>
              ))
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                Sin datos de gráfico
              </div>
            )}

            {hoveredBar && (
              <div className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg bg-gray-900 px-3 py-1.5 text-[10px] text-white shadow-lg transition-opacity duration-200">
                {hoveredBar.time}:{' '}
                <span className="font-semibold text-blue-300">{hoveredBar.value}% capacidad</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <h3 className="mb-1 text-base font-semibold text-gray-900">Origen de reservas</h3>
          <p className="mb-6 text-xs text-gray-500">Desglose acumulado por canal de adquisición</p>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-4 w-full rounded-md bg-gray-100" />
                ))}
              </div>
            ) : channelData.length > 0 ? (
              channelData.map((channel, index) => (
                <div key={`${channel.name}-${index}`} className="flex items-center justify-between text-xs">
                  <span className="w-20 font-medium text-gray-600">{channel.name}</span>
                  <div className="mx-3 h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#0070F3] transition-all duration-700 ease-out"
                      style={{ width: channel.percent }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold text-gray-900">{channel.count}</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-gray-400">No hay canales para mostrar</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Ocupación por propiedad</h3>
              <p className="mt-0.5 text-xs text-gray-500">Unidades de la red con mayor demanda</p>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0070F3]">
              <span className="h-2 w-2 rounded-full bg-[#0070F3] animate-ping" />
              Sincronizado
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-6 w-full rounded-md bg-gray-100" />
                ))}
              </div>
            ) : propertiesData.length > 0 ? (
              propertiesData.map((property, index) => (
                <div
                  key={`${property.name}-${index}`}
                  className="flex items-center rounded-lg p-1.5 text-xs transition-colors hover:bg-gray-50/80"
                >
                  <div className="w-32 shrink-0 sm:w-44">
                    <p className="font-semibold text-gray-900">{property.name}</p>
                    <p className="text-[10px] text-gray-400">{property.location}</p>
                  </div>
                  <div className="mx-3 h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#0070F3] transition-all duration-700 ease-out"
                      style={{ width: `${property.percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-[#0070F3]">{property.percent}%</span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-gray-400">No hay registros de propiedades</p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md md:p-7">
          <div>
            <h3 className="mb-1 text-base font-semibold text-gray-900">Actividad reciente</h3>
            <p className="mb-5 text-xs text-gray-500">Últimos eventos registrados en la plataforma</p>

            <ul className="space-y-3.5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-8 w-full rounded-md bg-gray-100" />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <li
                    key={`${activity.user}-${activity.time}-${index}`}
                    className="flex gap-2.5 rounded-lg p-1 text-xs transition-colors hover:bg-gray-50/80"
                  >
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0070F3]" />
                    <div>
                      <p className="text-gray-800">
                        <span className="font-semibold text-gray-900">{activity.user}</span> {activity.action}{' '}
                        <span className="font-mono text-[11px] font-semibold text-gray-600">{activity.res}</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {activity.time} · {activity.prop}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-gray-400">No hay actividad reciente</p>
              )}
            </ul>
          </div>

          {(isRecepcionista || isAdmin) && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <Link
                to="/reservations"
                className="block text-center text-xs font-semibold text-[#0070F3] transition-colors hover:text-blue-700"
              >
                Ver todas las reservas →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
