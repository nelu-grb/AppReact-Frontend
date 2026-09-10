import { useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';

interface TopUnit {
  id: string;
  name: string;
  location: string;
  type: 'Cabaña' | 'Hostal' | 'Lodge';
  bookings: number;
  occupancy: number; // Porcentaje numérico para facilitar cálculos y renders
  revenue: string;
}

type TimeRange = 'last24h' | 'last7d' | 'last30d';

export default function Reports() {
  const { isAdmin, isAuditor } = useUserRole();
  const [timeRange, setTimeRange] = useState<TimeRange>('last24h');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Control de Acceso (RBAC): Solo Admin y Auditor tienen acceso a Reportería
  const canViewReports = isAdmin || isAuditor;

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

  // Datos reactivos simulados según rango de tiempo
  const kpiData = {
    last24h: { avgBookings: '4.8', growth: '+12%', cycleTime: '18 min', occupancy: '77%', activeRooms: '134 de 174' },
    last7d: { avgBookings: '5.2', growth: '+8%', cycleTime: '15 min', occupancy: '82%', activeRooms: '143 de 174' },
    last30d: { avgBookings: '4.5', growth: '+15%', cycleTime: '21 min', occupancy: '79%', activeRooms: '138 de 174' },
  }[timeRange];

  const topUnits: TopUnit[] = [
    { id: 'U-01', name: 'Cabaña Bosque Nativo #4', location: 'Pucón', type: 'Cabaña', bookings: 42, occupancy: 94, revenue: '$4.280.000' },
    { id: 'U-02', name: 'Habitación Vista Volcán #102', location: 'Puerto Varas', type: 'Hostal', bookings: 38, occupancy: 89, revenue: '$2.950.000' },
    { id: 'U-03', name: 'Lodge Termas del Valle #1', location: 'Curacautín', type: 'Lodge', bookings: 31, occupancy: 82, revenue: '$3.720.000' },
    { id: 'U-04', name: 'Habitación Estándar #08', location: 'San Pedro de Atacama', type: 'Hostal', bookings: 27, occupancy: 78, revenue: '$1.890.000' },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Informe descargado correctamente en formato CSV.');
    }, 1000);
  };

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
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Kafka Live Stream
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Indicadores clave procesados mediante agregaciones en tiempo real para la toma de decisiones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-white border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#1A423B] cursor-pointer"
            >
              <option value="last24h">Últimas 24 horas</option>
              <option value="last7d">Últimos 7 días</option>
              <option value="last30d">Últimos 30 días</option>
            </select>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="bg-[#1A423B] hover:bg-[#13332d] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Core (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Reservas por Hora (Promedio)
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {kpiData.growth}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">{kpiData.avgBookings}</span>
              <span className="text-xs text-gray-500">solicitudes/hora</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Pico registrado entre las 19:00 y 21:00 hrs.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tiempo de Ciclo Promedio
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Óptimo
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">{kpiData.cycleTime}</span>
              <span className="text-xs text-gray-500">creación → confirmación</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tiempo medio de confirmación por el operador.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Tasa de Ocupación Activa
              </span>
              <span className="text-xs font-bold text-[#CB6D51] bg-[#CB6D51]/10 px-2 py-0.5 rounded-full">
                Red Total
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">{kpiData.occupancy}</span>
              <span className="text-xs text-gray-500">{kpiData.activeRooms} hab.</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Calculada en tiempo real sobre unidades operativas.</p>
          </div>
        </div>

        {/* Tabla de Unidades Más Demandadas */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Unidades Más Demandadas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Top alojamientos ordenados por volumen de reserva</p>
            </div>
            <span className="text-xs font-semibold text-[#1A423B] bg-[#1A423B]/5 px-2.5 py-1 rounded-lg">
              {topUnits.length} propiedades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Unidad</th>
                  <th className="px-6 py-3.5">Destino</th>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">Reservas Registradas</th>
                  <th className="px-6 py-3.5">Ocupación</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Ingresos Est.</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {topUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{unit.name}</td>
                    <td className="px-6 py-4 text-gray-600">{unit.location}</td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1A423B]/10 text-[#1A423B]">
                        {unit.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{unit.bookings}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#CB6D51] h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${unit.occupancy}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{unit.occupancy}%</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{unit.revenue}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}