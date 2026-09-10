import { useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';

type AuditAction = 'CREACIÓN' | 'CONFIRMACIÓN' | 'CHECK-IN' | 'CHECK-OUT' | 'CANCELACIÓN';

interface AuditEvent {
  id: string;
  timestamp: string;
  reservationId: string;
  user: string;
  action: AuditAction;
  details: string;
  ip: string;
  payload?: Record<string, unknown>;
}

const INITIAL_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-9081',
    timestamp: '10/09/2026 15:42',
    reservationId: 'R-2026-0894',
    user: 'admin.prueba@andesstay.cl',
    action: 'CONFIRMACIÓN',
    details: 'Estado cambiado de CREADA a CONFIRMADA. Evento emitido a broker de mensajería.',
    ip: '190.160.24.12',
    payload: {
      eventId: 'EVT-9081',
      sourceService: 'reservation-service',
      previousState: 'CREATED',
      newState: 'CONFIRMED',
      processedBy: 'admin.prueba@andesstay.cl',
      rabbitmqCluster: 'cluster-prod-sa-east-1',
    },
  },
  {
    id: 'EVT-9080',
    timestamp: '10/09/2026 14:15',
    reservationId: 'R-2026-0894',
    user: 'carlos.mendoza@gmail.com',
    action: 'CREACIÓN',
    details: 'Reserva web generada para Cabaña Bosque Nativo #4.',
    ip: '201.214.90.3',
    payload: {
      eventId: 'EVT-9080',
      sourceService: 'web-checkout-gateway',
      propertyId: 'PROP-PUC-004',
      nights: 4,
      totalAmount: 428000,
      currency: 'CLP',
    },
  },
  {
    id: 'EVT-9079',
    timestamp: '09/09/2026 11:28',
    reservationId: 'R-2026-0891',
    user: 'recepcion.pucon@andesstay.cl',
    action: 'CHECK-IN',
    details: 'Huésped ingresó a la unidad. Ticket de housekeeping marcado como COMPLETADO.',
    ip: '190.160.24.12',
    payload: {
      eventId: 'EVT-9079',
      sourceService: 'frontdesk-app',
      keyCardIssued: true,
      roomNumber: '102',
      verifiedIdentityDoc: 'RUT-CHILE',
    },
  },
  {
    id: 'EVT-9078',
    timestamp: '08/09/2026 18:05',
    reservationId: 'R-2026-0887',
    user: 'admin.prueba@andesstay.cl',
    action: 'CHECK-OUT',
    details: 'Cierre de estadía. Cupo liberado en catálogo y sincronizado con OTAs.',
    ip: '190.160.24.12',
    payload: {
      eventId: 'EVT-9078',
      sourceService: 'reservation-service',
      minibarConsumed: 0,
      checkoutLate: false,
    },
  },
  {
    id: 'EVT-9077',
    timestamp: '07/09/2026 09:12',
    reservationId: 'R-2026-0880',
    user: 'ana.beltran@gmail.com',
    action: 'CANCELACIÓN',
    details: 'Cancelación solicitada por el usuario fuera de ventana de penalización.',
    ip: '186.105.12.88',
    payload: {
      eventId: 'EVT-9077',
      reason: 'USER_REQUEST',
      refundIssued: true,
      refundAmount: 180000,
    },
  },
];

export default function Audit() {
  const { isAdmin, isAuditor } = useUserRole();
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  // Protección RBAC: Solo Administradores y Auditores pueden acceder
  const canViewAudit = isAdmin || isAuditor;

  if (!canViewAudit) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            No posees los permisos necesarios (Auditor o Admin) para consultar la trazabilidad del log de auditoría inmutable.
          </p>
        </div>
      </div>
    );
  }

  const filteredEvents = INITIAL_EVENTS.filter((evt) => {
    const matchesAction = filterAction === 'ALL' || evt.action === filterAction;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      evt.user.toLowerCase().includes(term) ||
      evt.reservationId.toLowerCase().includes(term) ||
      evt.id.toLowerCase().includes(term) ||
      evt.details.toLowerCase().includes(term) ||
      evt.ip.includes(term);

    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: AuditAction) => {
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

  const clearFilters = () => {
    setFilterAction('ALL');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans relative">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Encabezado e Indicadores */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Timeline de Auditoría
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Solo Lectura
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registro inmutable de eventos consumidos en tiempo real desde Kafka Topic (<code className="font-mono text-[11px] text-[#1A423B]">andesstay-audit-events</code>).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-700 text-xs font-semibold self-start md:self-auto shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kafka Consumer Active
          </div>
        </div>

        {/* Barra de Filtros y Control */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96 relative">
            <input
              type="text"
              placeholder="Buscar por evento, usuario, reserva o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1A423B] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acción:</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-gray-50/80 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-[#1A423B] cursor-pointer"
            >
              <option value="ALL">Todos los eventos</option>
              <option value="CREACIÓN">Creación</option>
              <option value="CONFIRMACIÓN">Confirmación</option>
              <option value="CHECK-IN">Check-In</option>
              <option value="CHECK-OUT">Check-Out</option>
              <option value="CANCELACIÓN">Cancelación</option>
            </select>

            {(filterAction !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-[#CB6D51] hover:underline px-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Eventos */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
            <span className="text-xs font-semibold text-gray-500">
              Mostrando <strong className="text-gray-900">{filteredEvents.length}</strong> de {INITIAL_EVENTS.length} registros
            </span>
            <span className="text-[10px] font-mono text-gray-400">RETENTION_POLICY: 365 DAYS</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-gray-700">No se encontraron eventos</p>
              <p className="text-xs text-gray-400 mt-1">Prueba cambiando los términos de búsqueda o el filtro de acción.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-xs font-bold text-[#1A423B] bg-[#1A423B]/10 px-4 py-2 rounded-lg hover:bg-[#1A423B]/20 transition-colors"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">ID Evento / Fecha</th>
                    <th className="px-6 py-3.5">Reserva</th>
                    <th className="px-6 py-3.5">Acción</th>
                    <th className="px-6 py-3.5">Usuario Responsable</th>
                    <th className="px-6 py-3.5">Detalles de Operación</th>
                    <th className="px-6 py-3.5 text-right">IP Origen</th>
                    <th className="px-6 py-3.5 text-center">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900 block">{evt.id}</span>
                        <span className="font-mono text-[10px] text-gray-400">{evt.timestamp}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-800">{evt.reservationId}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getActionBadgeColor(evt.action)}`}>
                          {evt.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{evt.user}</td>
                      <td className="px-6 py-4 text-gray-700 max-w-sm leading-relaxed">{evt.details}</td>
                      <td className="px-6 py-4 text-right font-mono text-[11px] text-gray-400">{evt.ip}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="text-[11px] font-semibold text-[#1A423B] hover:text-[#13332d] bg-[#1A423B]/5 hover:bg-[#1A423B]/10 px-2.5 py-1 rounded transition-colors"
                        >
                          Ver JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Inspector de Payload JSON */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Inspector de Evento Kafka</h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{selectedEvent.id} — {selectedEvent.reservationId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 rounded-full bg-gray-200/60 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Resumen de Transacción
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedEvent.details}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Raw Event Payload (JSON)
                </span>
                <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                  {JSON.stringify(selectedEvent.payload || selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="bg-[#1A423B] hover:bg-[#13332d] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}