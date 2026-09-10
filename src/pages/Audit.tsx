import { useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';

interface AuditEvent {
  id: string;
  timestamp: string;
  reservationId: string;
  user: string;
  action: 'CREACIÓN' | 'CONFIRMACIÓN' | 'CHECK-IN' | 'CHECK-OUT' | 'CANCELACIÓN';
  details: string;
  ip: string;
}

const INITIAL_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-9081',
    timestamp: '04/09/2026 15:42',
    reservationId: 'R-2024-0894',
    user: 'admin.prueba@andesstay.cl',
    action: 'CONFIRMACIÓN',
    details: 'Estado cambiado de CREADA a CONFIRMADA. Notificación RabbitMQ enviada.',
    ip: '190.160.24.12',
  },
  {
    id: 'EVT-9080',
    timestamp: '04/09/2026 14:15',
    reservationId: 'R-2024-0894',
    user: 'carlos.mendoza@gmail.com',
    action: 'CREACIÓN',
    details: 'Reserva web generada para Cabaña Bosque Nativo #4.',
    ip: '201.214.90.3',
  },
  {
    id: 'EVT-9079',
    timestamp: '04/09/2026 11:28',
    reservationId: 'R-2024-0891',
    user: 'admin.prueba@andesstay.cl',
    action: 'CHECK-IN',
    details: 'Huésped ingresó a la unidad. Ticket de housekeeping finalizado.',
    ip: '190.160.24.12',
  },
  {
    id: 'EVT-9078',
    timestamp: '03/09/2026 18:05',
    reservationId: 'R-2024-0887',
    user: 'admin.prueba@andesstay.cl',
    action: 'CHECK-OUT',
    details: 'Cierre de estadía. Cupo liberado en catálogo.',
    ip: '190.160.24.12',
  },
];

export default function Audit() {
  const { isAdmin, isAuditor } = useUserRole();
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Protección RBAC: Solo Administradores y Auditores pueden acceder
  const canViewAudit = isAdmin || isAuditor;

  if (!canViewAudit) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-xs text-gray-500">
            No posees los permisos necesarios (Auditor o Admin) para consultar la trazabilidad del log de auditoría.
          </p>
        </div>
      </div>
    );
  }

  const filteredEvents = INITIAL_EVENTS.filter((evt) => {
    const matchesAction = filterAction === 'ALL' || evt.action === filterAction;
    const matchesSearch =
      evt.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.reservationId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: AuditEvent['action']) => {
    switch (action) {
      case 'CREACIÓN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMACIÓN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CHECK-IN':
        return 'bg-[#CB6D51]/10 text-[#CB6D51] border-[#CB6D51]/20';
      case 'CHECK-OUT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CANCELACIÓN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Encabezado e Indicadores */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Timeline de Auditoría
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Solo Lectura
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Registro inmutable de eventos consumidos en tiempo real desde Kafka (`andesstay-audit-events`).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-semibold self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kafka Consumer Active
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por usuario o código de reserva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A423B]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-500 uppercase">Evento:</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A423B]"
            >
              <option value="ALL">Todos los eventos</option>
              <option value="CREACIÓN">Creación</option>
              <option value="CONFIRMACIÓN">Confirmación</option>
              <option value="CHECK-IN">Check-In</option>
              <option value="CHECK-OUT">Check-Out</option>
              <option value="CANCELACIÓN">Cancelación</option>
            </select>
          </div>
        </div>

        {/* Tabla de Eventos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Fecha y Hora</th>
                  <th className="px-6 py-3">Reserva</th>
                  <th className="px-6 py-3">Tipo Evento</th>
                  <th className="px-6 py-3">Usuario Responsable</th>
                  <th className="px-6 py-3">Detalles de Operación</th>
                  <th className="px-6 py-3 text-right">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {evt.timestamp}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{evt.reservationId}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${getActionBadgeColor(evt.action)}`}>
                        {evt.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{evt.user}</td>
                    <td className="px-6 py-4 text-gray-700 text-xs max-w-md">{evt.details}</td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">{evt.ip}</td>
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