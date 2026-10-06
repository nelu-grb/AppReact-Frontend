import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {useEffect} from 'react';

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


  // useEffect)
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
          setChartData(metrics.hourlyDistribution);
          setChannelData(metrics.channels);
        }
      } catch (error) {
        console.error('Error al cargar datos del Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Arreglo vacío para que se ejecute solo 1 vez al cargar la pantalla

  // 3. Estado de carga antes de renderizar JSX
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 animate-pulse">Cargando métricas en tiempo real...</p>
      </div>
    );
  }


  if (isHuesped) {
    return (
      <div className="flex-1 p-5 md:p-8 xl:p-10 overflow-y-auto bg-[#F4F6F6] space-y-6 font-sans">
        <div className="bg-[#1A423B] rounded-2xl p-6 md:p-9 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">¡Hola, {fullName || 'Huésped'}! </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              Bienvenido a tu panel de AndesStay. Gestiona tus estadías activas o explora nuevas propiedades disponibles para tus próximas vacaciones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/reservations"
                className="bg-[#CB6D51] hover:bg-[#b85e44] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-xs"
              >
                Mis Reservas
              </Link>
              <Link
                to="/catalog"
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors border border-white/20"
              >
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm">
            <h2 className="font-bold text-gray-800 text-base mb-4">Próxima Estadía</h2>
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Reserva Confirmada</span>
              <p className="font-semibold text-gray-900 text-sm mt-1">Cabaña Bosque Nativo #4 — Pucón</p>
              <p className="text-xs text-gray-600 mt-1">Check-in listo para coordinar en recepción.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-gray-800 text-base mb-1">Soporte al Huésped</h2>
              <p className="text-xs text-gray-500">¿Necesitas ayuda adicional con tus fechas o equipaje?</p>
            </div>
            <a
              href="https://wa.me/56900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1A423B] hover:text-[#13332d] transition-colors"
            >
              Contactar con Recepción vía WhatsApp &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 md:p-8 xl:p-10 overflow-y-auto bg-[#F4F6F6] font-sans">
      <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Panel de Control — {fullName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin && 'Vista Administrador: Consolidado general y rendimiento operacional de AndesStay.'}
            {isRecepcionista && 'Vista Recepción: Gestión en tiempo real de entradas, salidas y limpieza.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex text-xs font-medium">
            {(['hoy', 'semana', 'mes'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  activeRange === range
                    ? 'bg-[#1A423B] text-white shadow-2xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold px-3 py-1.5 bg-[#1A423B] text-white rounded-lg shadow-2xs">
            Rol: {primaryRole}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-7">
        <div className="bg-[#1A423B] rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
          <h3 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Ocupación Red</h3>
          <div className="my-3">
            <span className="text-4xl font-extrabold tracking-tight">77%</span>
          </div>
          <p className="text-xs text-emerald-100/80">134 de 174 habitaciones ocupadas</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Check-ins Activos</h3>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">6</span>
          </div>
          <p className="text-xs text-gray-500">Huéspedes actualmente en tránsito</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sin Confirmar</h3>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">3</span>
          </div>
          <p className="text-xs text-gray-500">Pendientes de pago o revisión</p>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Housekeeping</h3>
          <div className="my-3">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight">25</span>
          </div>
          <p className="text-xs text-gray-500">Unidades en cola de mantenimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6 mb-7">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-7 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Distribución de reservas por hora</h3>
              <p className="text-xs text-gray-500">Monitoreo de la demanda en el periodo seleccionado</p>
            </div>
            <span className="bg-red-50 text-[#CB6D51] border border-red-100 text-[11px] px-2.5 py-1 rounded-md font-semibold">
              Pico 16 h — 11 reservas
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4 relative">
            {chartData.map((data, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center w-full group relative cursor-pointer"
                onMouseEnter={() => setHoveredBar(data)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-200 ${
                    data.isPeak ? 'bg-[#CB6D51]' : 'bg-[#1A423B]/30 group-hover:bg-[#1A423B]'
                  }`}
                  style={{ height: `${data.value}%` }}
                ></div>
                <span className="text-[10px] text-gray-400 mt-2 font-mono">{data.time}</span>
              </div>
            ))}

            {hoveredBar && (
              <div className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] px-2.5 py-1 rounded shadow-md pointer-events-none">
                {hoveredBar.time}: <span className="font-bold">{hoveredBar.value}% capacidad</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-7 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base mb-1">Origen de reservas</h3>
          <p className="text-xs text-gray-500 mb-6">Desglose acumulado por canal de adquisición</p>
          <div className="space-y-4">
            {channelData.map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="w-20 text-gray-600 font-medium">{ch.name}</span>
                <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A423B] rounded-full" style={{ width: ch.percent }}></div>
                </div>
                <span className="w-6 text-right font-bold text-gray-900">{ch.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-7 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Ocupación por propiedad</h3>
              <p className="text-xs text-gray-500">Unidades de la red con mayor demanda</p>
            </div>
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Sincronizado</span>
          </div>

          <div className="space-y-4">
            {propertiesData.map((prop, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <div className="w-32 sm:w-44 shrink-0">
                  <p className="font-bold text-gray-900">{prop.name}</p>
                  <p className="text-[10px] text-gray-400">{prop.location}</p>
                </div>
                <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CB6D51] rounded-full" style={{ width: `${prop.percent}%` }}></div>
                </div>
                <span className="w-10 text-right font-extrabold text-[#CB6D51]">{prop.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 md:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Actividad reciente</h3>
            <p className="text-xs text-gray-500 mb-5">Últimos eventos registrados en la plataforma</p>
            <ul className="space-y-3.5">
              {recentActivity.map((act, idx) => (
                <li key={idx} className="flex gap-2.5 text-xs">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.color}`}></div>
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
              ))}
            </ul>
          </div>

          {(isRecepcionista || isAdmin) && (
            <div className="mt-5 pt-3 border-t border-gray-100">
              <Link
                to="/reservations"
                className="block text-center text-xs font-semibold text-[#1A423B] hover:text-[#13332d] transition-colors"
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