import { Link } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

export default function Dashboard() {
  const { fullName, isAdmin, isRecepcionista, isHuesped, isAuditor } = useUserRole();

  // Mock Data adaptada a fechas actuales
  const chartData = [
    { time: '08h', value: 40 }, { time: '09h', value: 65 },
    { time: '10h', value: 45 }, { time: '11h', value: 55 },
    { time: '12h', value: 70 }, { time: '13h', value: 65 },
    { time: '14h', value: 85 }, { time: '15h', value: 75 },
    { time: '16h', value: 100, isPeak: true },
    { time: '17h', value: 60 }, { time: '18h', value: 45 },
    { time: '19h', value: 30 },
  ];

  const channelData = [
    { name: 'Web', count: 14, percent: '70%' },
    { name: 'Instagram', count: 7, percent: '35%' },
    { name: 'WhatsApp', count: 6, percent: '30%' },
    { name: 'Directo', count: 3, percent: '15%' },
  ];

  const propertiesData = [
    { name: 'Los Boldos', location: 'Pucón', percent: 100 },
    { name: 'Todos Los Santos', location: 'Petrohué', percent: 100 },
    { name: 'Torres del Paine', location: 'Puerto Natales', percent: 93 },
    { name: 'Atacama Lodge', location: 'San Pedro de Atacama', percent: 92 },
    { name: 'Patagonia Sur', location: 'Puerto Natales', percent: 98 },
  ];

  const recentActivity = [
    { user: 'Carlos Núñez', action: 'check-in', res: 'R-2026-0891', time: '08:02 a. m.', prop: 'Patagonia Sur', color: 'bg-[#CB6D51]' },
    { user: 'Ana Beltrán', action: 'check-in', res: 'R-2026-0892', time: '08:17 a. m.', prop: 'Torres del Paine', color: 'bg-[#CB6D51]' },
    { user: 'Luis Pino', action: 'check-out', res: 'R-2026-0893', time: '09:05 a. m.', prop: 'El Roble', color: 'bg-[#EAB308]' },
    { user: 'María José Lagos', action: 'confirmó', res: 'R-2026-0894', time: '09:31 a. m.', prop: 'Atacama Lodge', color: 'bg-[#10B981]' },
  ];

  // 1. Vista Exclusiva para Huésped
  if (isHuesped) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[#F4F6F6] space-y-6">
        <div className="bg-[#1A423B] rounded-2xl p-8 text-white shadow-md">
          <h1 className="text-2xl font-bold mb-2">¡Hola, {fullName || 'Huésped'}! 👋</h1>
          <p className="text-emerald-100 text-sm max-w-xl">
            Bienvenido a tu panel de AndesStay. Desde aquí puedes revisar el estado de tus reservas activas o explorar nuevas unidades disponibles para tu próxima escapada.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/reservations"
              className="bg-[#CB6D51] hover:bg-[#b85e44] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-2">Próxima Estadía</h2>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Reserva Confirmada</span>
              <p className="font-semibold text-gray-900 mt-1">Cabaña Bosque Nativo #4 — Pucón</p>
              <p className="text-xs text-gray-600 mt-1">Check-in disponible pronto en recepción.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-2">Soporte al Huésped</h2>
            <p className="text-xs text-gray-500 mb-4">¿Necesitas realizar un cambio o solicitar asistencia adicional?</p>
            <a
              href="https://wa.me/56900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1A423B] hover:underline"
            >
              Contactar a Recepción por WhatsApp &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Vista Operacional (Recepcionista) o Ejecutiva (Admin / Auditor)
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F4F6F6]">
      {/* Saludo de Bienvenida por Rol */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel de Control — {fullName}</h1>
          <p className="text-xs text-gray-500">
            {isAdmin && 'Vista Administrador: Consolidado general de la red AndesStay.'}
            {isRecepcionista && 'Vista Recepción: Operaciones del día y recepción de huéspedes.'}
            {isAuditor && 'Vista Auditoría: Métricas de rendimiento e historial de eventos.'}
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-[#1A423B] text-white rounded-full">
          Rol: {isAdmin ? 'Admin' : isRecepcionista ? 'Recepcionista' : 'Auditor'}
        </span>
      </div>

      {/* Fila 1: Tarjetas Superiores (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#1A423B] rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-bold text-emerald-100 tracking-widest uppercase mb-1">Ocupación Red</h3>
          <div className="text-4xl font-bold text-white mb-1">77%</div>
          <p className="text-sm text-emerald-200">134 de 174 hab.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Check-ins Activos</h3>
          <div className="text-4xl font-bold text-gray-800 mb-1">6</div>
          <p className="text-sm text-gray-500">Huéspedes en propiedad</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Sin Confirmar</h3>
          <div className="text-4xl font-bold text-gray-800 mb-1">3</div>
          <p className="text-sm text-gray-500">Requieren acción</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Housekeeping</h3>
          <div className="text-4xl font-bold text-gray-800 mb-1">25</div>
          <p className="text-sm text-gray-500">Habitaciones en cola</p>
        </div>
      </div>

      {/* Fila 2: Gráficos Intermedios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-bold text-gray-800">Reservas por hora</h3>
              <p className="text-xs text-gray-400">Jornada de hoy</p>
            </div>
            <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2 py-1 rounded font-medium">
              Pico 16 h — 11 reservas
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 md:gap-4 mt-auto">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center w-full group">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    data.isPeak ? 'bg-[#CB6D51]' : 'bg-[#82A098] group-hover:bg-[#6b8c83]'
                  }`}
                  style={{ height: `${data.value}%` }}
                ></div>
                <span className="text-[10px] text-gray-400 mt-3 font-mono">{data.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Por canal — hoy</h3>
          <div className="space-y-5">
            {channelData.map((ch, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="w-20 text-gray-600">{ch.name}</span>
                <div className="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A423B] rounded-full" style={{ width: ch.percent }}></div>
                </div>
                <span className="w-4 text-right font-semibold text-gray-800">{ch.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 3: Tablas Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-bold text-gray-800">Ocupación por propiedad</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Tiempo real</span>
          </div>
          <div className="space-y-5">
            {propertiesData.map((prop, idx) => (
              <div key={idx} className="flex items-center text-sm">
                <div className="w-40">
                  <p className="font-semibold text-gray-800">{prop.name}</p>
                  <p className="text-[10px] text-gray-400">{prop.location}</p>
                </div>
                <div className="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CB6D51] rounded-full" style={{ width: `${prop.percent}%` }}></div>
                </div>
                <span className="w-8 text-right font-bold text-[#CB6D51]">{prop.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Actividad reciente</h3>
          <ul className="space-y-4">
            {recentActivity.map((act, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.color}`}></div>
                <div>
                  <p className="text-gray-800">
                    <span className="font-semibold">{act.user}</span> {act.action} <span className="font-mono text-xs">{act.res}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {act.time} · {act.prop}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}