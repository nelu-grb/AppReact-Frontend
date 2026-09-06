
export default function Reports() {
  const topUnits = [
    { name: 'Cabaña Bosque Nativo #4', location: 'Pucón', type: 'Cabaña', bookings: 42, occupancy: '94%', revenue: '$4.280.000' },
    { name: 'Habitación Vista Volcán #102', location: 'Puerto Varas', type: 'Hostal', bookings: 38, occupancy: '89%', revenue: '$2.950.000' },
    { name: 'Lodge Termas del Valle #1', location: 'Curacautín', type: 'Lodge', bookings: 31, occupancy: '82%', revenue: '$3.720.000' },
    { name: 'Habitación Estándar #08', location: 'San Pedro', type: 'Hostal', bookings: 27, occupancy: '78%', revenue: '$1.890.000' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reportería & Analítica</h1>
            <p className="text-sm text-gray-500 mt-1">
              Indicadores clave procesados mediante eventos y agregaciones en streaming.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-white border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A423B]">
              <option value="last24h">Últimas 24 horas</option>
              <option value="last7d">Últimos 7 días</option>
              <option value="last30d">Últimos 30 días</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de Métricas Core (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reservas por Hora (Promedio)</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">4.8</span>
              <span className="text-xs text-gray-500">solicitudes/hora</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Pico registrado entre las 19:00 y 21:00 hrs.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiempo de Ciclo Promedio</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Óptimo</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">18 min</span>
              <span className="text-xs text-gray-500">creación → confirmación</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tiempo de respuesta del operador en confirmar.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa de Ocupación Activa</span>
              <span className="text-xs font-bold text-[#CB6D51] bg-[#CB6D51]/10 px-2 py-0.5 rounded-full">Red Total</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">77%</span>
              <span className="text-xs text-gray-500">134 de 174 hab.</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Calculada en tiempo real sobre unidades operativas.</p>
          </div>
        </div>

        {/* Tabla de Unidades Más Demandadas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Unidades Más Demandadas</h2>
            <span className="text-xs text-gray-400 font-medium">Top alojamientos por volumen de reserva</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Unidad</th>
                  <th className="px-6 py-3">Destino</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Reservas Registradas</th>
                  <th className="px-6 py-3">Ocupación</th>
                  <th className="px-6 py-3 text-right">Ingresos Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {topUnits.map((unit, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{unit.name}</td>
                    <td className="px-6 py-4 text-gray-600">{unit.location}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#1A423B]/10 text-[#1A423B]">
                        {unit.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{unit.bookings}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#CB6D51] h-1.5 rounded-full" style={{ width: unit.occupancy }}></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{unit.occupancy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{unit.revenue}</td>
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