import { useState } from 'react';
import Layout from '../components/Layout';
import { Sidebar, SidebarFilterGroup } from '../components/Sidebar';

// Componente interno para colorear la etiqueta de acción
function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    'check-in': 'bg-red-50 text-red-600 border-red-200',
    'check-out': 'bg-amber-50 text-amber-600 border-amber-200',
    'confirmó': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'creó': 'bg-teal-50 text-teal-600 border-teal-200',
    'modificó': 'bg-gray-50 text-gray-600 border-gray-200',
    'canceló': 'bg-gray-100 text-gray-500 border-gray-300',
  };

  const currentStyle = styles[action] || 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <span className={`px-2.5 py-1 text-xs rounded-sm border font-medium ${currentStyle}`}>
      {action}
    </span>
  );
}

export default function Audit() {
  const [activeAccion, setActiveAccion] = useState('Todas');

  // Datos mockeados basados en la imagen de Auditoría
  const auditEvents = [
    { time: '15-mar, 08:02 a. m.', user: 'Carlos Núñez', action: 'check-in', res: 'R-2024-0891', prop: 'Patagonia Sur', detail: 'Check-in completado · Suite 3 · 2 huéspedes' },
    { time: '15-mar, 08:17 a. m.', user: 'Ana Beltrán', action: 'check-in', res: 'R-2024-0892', prop: 'Torres del Paine', detail: 'Check-in completado · Hab. 7 · 2 huéspedes' },
    { time: '15-mar, 09:05 a. m.', user: 'Luis Pino', action: 'check-out', res: 'R-2024-0893', prop: 'El Roble', detail: 'Check-out completado · Dorm 4A · duración: 2 noches' },
    { time: '15-mar, 09:31 a. m.', user: 'María José Lagos', action: 'confirmó', res: 'R-2024-0894', prop: 'Atacama Lodge', detail: 'Reserva confirmada · Hab. 2 · $225.000 CLP' },
    { time: '15-mar, 10:14 a. m.', user: 'Carlos Núñez', action: 'creó', res: 'R-2024-0895', prop: 'Los Boldos', detail: 'Nueva reserva · Cabaña A · canal: WhatsApp' },
    { time: '15-mar, 10:45 a. m.', user: 'Ana Beltrán', action: 'check-in', res: 'R-2024-0896', prop: 'Cerro Azul', detail: 'Check-in completado · Hab. 5 · 2 huéspedes' },
    { time: '15-mar, 11:02 a. m.', user: 'Luis Pino', action: 'creó', res: 'R-2024-0897', prop: 'Torres del Paine', detail: 'Nueva reserva · Hab. 12 · canal: Web' },
    { time: '15-mar, 11:28 a. m.', user: 'María José Lagos', action: 'check-in', res: 'R-2024-0898', prop: 'Lago Llanquihue', detail: 'Check-in completado · Cabaña 3 · 3 huéspedes' },
    { time: '15-mar, 12:00 p. m.', user: 'Carlos Núñez', action: 'check-out', res: 'R-2024-0899', prop: 'El Calafate', detail: 'Check-out completado · Hab. 3 · duración: 1 noche' },
    { time: '15-mar, 03:22 p. m.', user: 'María José Lagos', action: 'modificó', res: 'R-2024-0895', prop: 'Los Boldos', detail: 'Reserva modificada · fechas actualizadas → 17-22 Mar' },
  ];

  return (
    <Layout>
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar de Auditoría */}
        <Sidebar>
          <SidebarFilterGroup 
            title="Acción" 
            items={['Todas', 'creó', 'confirmó', 'check-in', 'check-out', 'modificó', 'canceló']}
            activeItem={activeAccion}
            onItemClick={setActiveAccion}
          />
        </Sidebar>

        {/* Main Content (Tabla) */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#F4F6F6]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Log de auditoría</h1>
              <p className="text-sm text-gray-500">20 eventos</p>
            </div>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Buscar usuario, reserva, propiedad" 
                className="border border-gray-300 rounded-md px-4 py-2 text-sm w-72 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#CB6D51]" 
              />
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium text-sm shadow-sm hover:bg-gray-50 transition-colors">
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#F8F9FA] text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Usuario</th>
                  <th className="px-6 py-4 font-semibold">Acción</th>
                  <th className="px-6 py-4 font-semibold">Reserva</th>
                  <th className="px-6 py-4 font-semibold">Propiedad</th>
                  <th className="px-6 py-4 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {auditEvents.map((evento, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{evento.time}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{evento.user}</td>
                    <td className="px-6 py-3">
                      <ActionBadge action={evento.action} />
                    </td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{evento.res}</td>
                    <td className="px-6 py-3 text-gray-600">{evento.prop}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs truncate max-w-xs" title={evento.detail}>
                      {evento.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </Layout>
  );
}