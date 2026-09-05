import { useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../services/apiClient';

export default function Dashboard() {

/* // useeffefct para pruebas de interceptores 
 useEffect(() => {
    // Petición de prueba para disparar los interceptores
    apiClient.get('/api/test')
      .then((res) => console.log('Respuesta del backend:', res.data))
      .catch((err) => console.log('Petición interceptada correctamente:', err));
  }, []);
*/



  // Mock Data para simular la respuesta del BFF
  const chartData = [
    { time: '08h', value: 40 }, { time: '09h', value: 65 },
    { time: '10h', value: 45 }, { time: '11h', value: 55 },
    { time: '12h', value: 70 }, { time: '13h', value: 65 },
    { time: '14h', value: 85 }, { time: '15h', value: 75 },
    { time: '16h', value: 100, isPeak: true }, // Pico destacado
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
    { user: 'Carlos Núñez', action: 'check-in', res: 'R-2024-0891', time: '08:02 a. m.', prop: 'Patagonia Sur', color: 'bg-[#CB6D51]' },
    { user: 'Ana Beltrán', action: 'check-in', res: 'R-2024-0892', time: '08:17 a. m.', prop: 'Torres del Paine', color: 'bg-[#CB6D51]' },
    { user: 'Luis Pino', action: 'check-out', res: 'R-2024-0893', time: '09:05 a. m.', prop: 'El Roble', color: 'bg-[#EAB308]' },
    { user: 'María José Lagos', action: 'confirmó', res: 'R-2024-0894', time: '09:31 a. m.', prop: 'Atacama Lodge', color: 'bg-[#10B981]' },
    { user: 'Carlos Núñez', action: 'creó', res: 'R-2024-0895', time: '10:14 a. m.', prop: 'Los Boldos', color: 'bg-[#10B981]' },
  ];

  return (
    <Layout>
      <div className="flex-1 p-8 overflow-y-auto bg-[#F4F6F6]">
        
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
          {/* Reservas por hora (Ocupa 2 columnas) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-bold text-gray-800">Reservas por hora</h3>
                <p className="text-xs text-gray-400">Hoy — vie 15 mar 2024</p>
              </div>
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2 py-1 rounded font-medium">
                Pico 16 h — 11 reservas
              </span>
            </div>
            
            {/* Maquetación CSS pura del gráfico de barras */}
            <div className="h-48 flex items-end justify-between gap-2 md:gap-4 mt-auto">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center w-full group">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-300 ${data.isPeak ? 'bg-[#CB6D51]' : 'bg-[#82A098] group-hover:bg-[#6b8c83]'}`}
                    style={{ height: `${data.value}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-400 mt-3 font-mono">{data.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Por canal */}
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
          {/* Ocupación por propiedad */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-bold text-gray-800">Ocupación por propiedad</h3>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Top 7 - en tiempo real</span>
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

          {/* Actividad reciente */}
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
    </Layout>
  );
}