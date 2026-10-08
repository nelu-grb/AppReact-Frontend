import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  color: string;
}

export default function Dashboard() {
  const { fullName, primaryRole, isAdmin, isRecepcionista, isHuesped } = useAuth();
  const [activeRange, setActiveRange] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [hoveredBar, setHoveredBar] = useState<ChartPoint | null>(null);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [channelData, setChannelData] = useState<ChannelStat[]>([]);
  const [propertiesData, setPropertiesData] = useState<PropertyOccupancy[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [resAudit, resCatalog, resMetrics] = await Promise.all([
          fetch(`${API_BASE_URL}/audit`),
          fetch(`${API_BASE_URL}/catalog/occupancy`),
          fetch(`${API_BASE_URL}/reservations/metrics`),
        ]);

        if (resAudit.ok) setRecentActivity(await resAudit.json());
        if (resCatalog.ok) setPropertiesData(await resCatalog.json());

        if (resMetrics.ok) {
          const metrics = await resMetrics.json();
          setChartData(metrics.hourlyDistribution || []);
          setChannelData(metrics.channels || []);
        }
      } catch (error) {
        console.error('Error al cargar datos del Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // VISTA DE HUÉSPED (Adaptada con la paleta limpia en azul)
  if (isHuesped) {
    return (
      <div className="flex-1 p-5 md:p-8 xl:p-10 overflow-y-auto bg-[#F4F6F9] space-y-6 font-sans">
        <div className="bg-white rounded-2xl p-6 md:p-9 border border-gray-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
              ¡Hola, {fullName || 'Huésped'}! 👋
            </h1>
            <p className="text-gray-500 text-sm max-w-xl leading-relaxed">
              Bienvenido a tu panel de AndesStay. Gestiona tus estadías activas o explora nuevas propiedades disponibles para tus próximas vacaciones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/reservations"
                className="bg-[#0070F3] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0"
              >
                Mis Reservas
              </Link>
              <Link
                to="/catalog"
                className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border border-gray-200 shadow-xs"
              >
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <h2 className="font-semibold text-gray-900 text-base mb-4">Próxima Estadía</h2>
            <div className="p-4 bg-[#EBF3FF] border border-blue-100 rounded-xl">
              <span className="text-[10px] font-bold text-[#0070F3] uppercase tracking-wider">
                Reserva Confirmada
              </span>
              <p className="font-semibold text-gray-900 text-sm mt-1">Cabaña Bosque Nativo #4 — Pucón</p>
              <p className="text-xs text-gray-500 mt-1">Check-in listo para coordinar en recepción.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-base mb-1">Soporte al Huésped</h2>
              <p className="text-xs text-gray-500">¿Necesitas ayuda adicional con tus fechas o equipaje?</p>
            </div>
            <a
              href="https://wa.me/56900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0070F3] hover:text-blue-700 transition-colors"
            >
              Contactar con Recepción vía WhatsApp &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE ADMINISTRACIÓN / RECEPCIÓN
  return (
    <div className="flex-1 p-5 md:p-8 xl:p-10 overflow-y-auto bg-[#F4F6F9] font-sans text-gray-800">
      
      {/* Encabezado */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
            Panel de Control — {fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin && 'Vista Administrador: Consolidado general y rendimiento operacional de AndesStay.'}
            {isRecepcionista && 'Vista Recepción: Gestión en tiempo real de entradas, salidas y limpieza.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex text-xs font-medium shadow-xs">
            {(['hoy', 'semana', 'mes'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                  activeRange === range
                    ? 'bg-gray-100 text-gray-900 font-semibold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold px-3.5 py-2 bg-[#0070F3] text-white rounded-xl shadow-xs">
            Rol: {primaryRole}
          </span>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ocupación Red</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">77%</span>
          </div>
          <p className="text-xs text-gray-500">134 de 174 habitaciones ocupadas</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Check-ins Activos</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">6</span>
          </div>
          <p className="text-xs text-gray-500">Huéspedes actualmente en tránsito</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sin Confirmar</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">3</span>
          </div>
          <p className="text-xs text-gray-500">Pendientes de pago o revisión</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Housekeeping</h3>
          <div className="my-2">
            <span className="text-3xl font-semibold text-gray-900 tracking-tight">25</span>
          </div>
          <p className="text-xs text-gray-500">Unidades en cola de limpieza</p>
        </div>
      </div>

      {/* Gráfico y Canales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-8">
        {/* Distribución por Hora */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm lg:col-span-2 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Distribución de reservas por hora</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monitoreo de la demanda en el periodo seleccionado</p>
            </div>
            <span className="bg-blue-50 text-[#0070F3] border border-blue-100 text-[11px] px-2.5 py-1 rounded-lg font-semibold animate-pulse">
              Pico 16 h — 11 reservas
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 relative border-b border-gray-100 pb-2">
            {loading ? (
              <div className="w-full h-full flex items-end gap-2 animate-pulse">
                {[40, 70, 30, 80, 50, 90, 60].map((h, i) => (
                  <div key={i} className="w-full bg-blue-50 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            ) : chartData.length > 0 ? (
              chartData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center w-full group relative cursor-pointer h-full justify-end"
                  onMouseEnter={() => setHoveredBar(data)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                      data.isPeak ? 'bg-[#0070F3]' : 'bg-[#EBF3FF] group-hover:bg-[#0070F3]/70'
                    }`}
                    style={{ height: `${data.value}%` }}
                  >
                    <div className="w-full h-1 bg-[#0070F3] rounded-t-md"></div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-mono">{data.time}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                Sin datos de gráfico
              </div>
            )}

            {hoveredBar && (
              <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg shadow-lg pointer-events-none transition-opacity duration-200 z-10">
                {hoveredBar.time}: <span className="font-semibold text-blue-300">{hoveredBar.value}% capacidad</span>
              </div>
            )}
          </div>
        </div>

        {/* Origen de Reservas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="font-semibold text-gray-900 text-base mb-1">Origen de reservas</h3>
          <p className="text-xs text-gray-500 mb-6">Desglose acumulado por canal de adquisición</p>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded-md w-full"></div>
                ))}
              </div>
            ) : channelData.length > 0 ? (
              channelData.map((ch, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="w-20 text-gray-600 font-medium">{ch.name}</span>
                  <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0070F3] rounded-full transition-all duration-700 ease-out"
                      style={{ width: ch.percent }}
                    ></div>
                  </div>
                  <span className="w-6 text-right font-bold text-gray-900">{ch.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No hay canales para mostrar</p>
            )}
          </div>
        </div>
      </div>

      {/* Ocupación por Propiedad y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Ocupación por Propiedad */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm lg:col-span-2 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Ocupación por propiedad</h3>
              <p className="text-xs text-gray-500 mt-0.5">Unidades de la red con mayor demanda</p>
            </div>
            <span className="text-[10px] text-[#0070F3] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-ping"></span>
              Sincronizado
            </span>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded-md w-full"></div>
                ))}
              </div>
            ) : propertiesData.length > 0 ? (
              propertiesData.map((prop, idx) => (
                <div key={idx} className="flex items-center text-xs hover:bg-gray-50/80 p-1.5 rounded-lg transition-colors">
                  <div className="w-32 sm:w-44 shrink-0">
                    <p className="font-semibold text-gray-900">{prop.name}</p>
                    <p className="text-[10px] text-gray-400">{prop.location}</p>
                  </div>
                  <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0070F3] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${prop.percent}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right font-bold text-[#0070F3]">{prop.percent}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No hay registros de propiedades</p>
            )}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div>
            <h3 className="font-semibold text-gray-900 text-base mb-1">Actividad reciente</h3>
            <p className="text-xs text-gray-500 mb-5">Últimos eventos registrados en la plataforma</p>

            <ul className="space-y-3.5">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded-md w-full"></div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((act, idx) => (
                  <li key={idx} className="flex gap-2.5 text-xs hover:bg-gray-50/80 p-1 rounded-lg transition-colors">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#0070F3]"></div>
                    <div>
                      <p className="text-gray-800">
                        <span className="font-semibold text-gray-900">{act.user}</span> {act.action}{' '}
                        <span className="font-mono text-[11px] text-gray-600 font-semibold">{act.res}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {act.time} · {act.prop}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No hay actividad reciente</p>
              )}
            </ul>
          </div>

          {(isRecepcionista || isAdmin) && (
            <div className="mt-5 pt-3 border-t border-gray-100">
              <Link
                to="/reservations"
                className="block text-center text-xs font-semibold text-[#0070F3] hover:text-blue-700 transition-colors"
              >
                Ver todas las reservas &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}