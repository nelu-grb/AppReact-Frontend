import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAuditEvents, type AuditEvent } from '../services/auditService';

export default function Audit() {
  const { isAdmin, isAuditor } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const canViewAudit = isAdmin || isAuditor;

  const loadEvents = async () => {
    try {
      setLoading(true);
      const auditEvents = await fetchAuditEvents();
      setEvents(auditEvents);
      setLoadError(false);
    } catch (error: unknown) {
      console.error('Error al cargar los eventos de auditoría:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewAudit) return;

    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) await loadEvents();
    };

    void fetchData();
    const refreshInterval = window.setInterval(() => {
      void fetchData();
    }, 10_000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [canViewAudit]);

  if (!canViewAudit) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            ✕
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            No posees los permisos necesarios (Auditor o Admin) para consultar los eventos de auditoría.
          </p>
        </div>
      </div>
    );
  }

  // Filtrado por término de búsqueda
  const filteredEvents = events.filter((evt) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    // Intentar leer datos formateados o extraídos
    const action = String(evt.action || '').toLowerCase();
    const user = String(evt.user || '').toLowerCase();
    const resId = String(evt.reservationId || '').toLowerCase();
    const id = String(evt.id || '').toLowerCase();
    const details = String(evt.details || '').toLowerCase();
    const title = String(evt.title || '').toLowerCase();

    return action.includes(term) || title.includes(term) || user.includes(term) ||
      resId.includes(term) || id.includes(term) || details.includes(term);
  }).sort((a, b) => {
    const timestampA = new Date(a.timestamp).getTime();
    const timestampB = new Date(b.timestamp).getTime();
    return (Number.isNaN(timestampB) ? 0 : timestampB) - (Number.isNaN(timestampA) ? 0 : timestampA);
  });

  // Agrupación auxiliar por fecha
  const groupEventsByDate = (eventList: AuditEvent[]) => {
    const groups: { [key: string]: AuditEvent[] } = {};

    eventList.forEach((evt) => {
      let dateKey = 'EVENTOS RECIENTES';
      if (evt.timestamp) {
        try {
          const date = new Date(evt.timestamp);
          if (!isNaN(date.getTime())) {
            dateKey = date.toLocaleDateString('es-CL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            dateKey = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
          }
        } catch {
          // Si no es fecha parsed, usar fallback
        }
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(evt);
    });

    return groups;
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  // Helper para iconos e identificadores según la acción
  const getEventVisuals = (action: string) => {
    const norm = (action || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (norm.includes('CREA')) {
      return {
        title: 'Reserva creada',
        icon: '+',
        iconBg: 'bg-blue-50 text-blue-500 border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-600 border-blue-100',
      };
    }
    if (norm.includes('CONFIRM')) {
      return {
        title: 'Reserva confirmada',
        icon: '✓',
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      };
    }
    if (norm.includes('CHECKIN') || norm.includes('CHECK-IN')) {
      return {
        title: 'Check-in registrado',
        icon: '→',
        iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
      };
    }
    if (norm.includes('CHECKOUT') || norm.includes('CHECK-OUT')) {
      return {
        title: 'Check-out registrado',
        icon: '←',
        iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
      };
    }
    if (norm.includes('CANCEL')) {
      return {
        title: 'Reserva cancelada',
        icon: '✕',
        iconBg: 'bg-rose-50 text-rose-500 border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-600 border-rose-100',
      };
    }
    if (norm.includes('STATUS_UPDATED') || norm.includes('UPDATED')) {
      return {
        title: 'Estado de reserva actualizado',
        icon: '↻',
        iconBg: 'bg-purple-50 text-purple-500 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
      };
    }
    if (norm.includes('ASSIGN')) {
      return {
        title: 'Habitación asignada',
        icon: '▣',
        iconBg: 'bg-purple-50 text-purple-500 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
      };
    }
    return {
      title: action || 'Actualización de evento',
      icon: '•',
      iconBg: 'bg-purple-50 text-purple-500 border-purple-200',
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
    };
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans text-xs pb-12">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Timeline de Auditoría
            </h1>
            <p className="text-gray-500 mt-1">
              Registro cronológico de eventos recibidos y consultados desde el servicio de auditoría.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium shadow-2xs transition-all cursor-pointer"
            >
              Exportar
            </button>
            <button
              type="button"
              onClick={() => void loadEvents()}
              className="flex items-center gap-1.5 bg-[#0062FF] hover:bg-[#0052d4] text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all cursor-pointer font-semibold"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda Centrada */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por evento, usuario, reserva, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0062FF] focus:bg-white transition-all text-xs text-gray-800"
            />
          </div>
        </div>

        {/* Dashboard de Eventos Agrupados por Fecha */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center text-gray-500">
              Cargando eventos de auditoría…
            </div>
          ) : loadError ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center">
              <p className="font-semibold text-gray-700">No se pudieron cargar los eventos</p>
              <p className="text-gray-400 mt-1">Revisa la conexión con el servicio de auditoría.</p>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center text-gray-500">
              No se encontraron eventos registrados.
            </div>
          ) : (
            Object.entries(groupedEvents).map(([dateLabel, groupList]) => (
              <div key={dateLabel} className="space-y-3">
                {/* Encabezado del Día */}
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {dateLabel}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {groupList.length} evento{groupList.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tarjeta Contenedora de Eventos del Día */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
                  {groupList.map((evt, idx) => {
                    const visuals = getEventVisuals(evt.action || '');
                    const formattedTime = formatTime(evt.timestamp);
                    const formattedId = evt.id || '—';
                    const eventTitle = evt.title || visuals.title || evt.action || '—';
                    const changeDescription = evt.details ||
                      (evt.previousState && evt.newState
                        ? `${evt.previousState} → ${evt.newState}`
                        : evt.reservationSummary) ||
                      'Sin detalle de cambio proporcionado';

                    return (
                      <div
                        key={evt.id || idx}
                        className="p-4 md:px-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* BLOQUE IZQUIERDO: Hora/ID + Icono + Nombre/Reserva/Detalles */}
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Hora e ID */}
                          <div className="w-16 shrink-0 text-left">
                            <span className="font-mono font-bold text-gray-900 text-xs block leading-tight">
                              {formattedTime}
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 block mt-0.5">
                              {formattedId}
                            </span>
                          </div>

                          {/* Icono Circular */}
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-sm ${visuals.iconBg}`}>
                            {visuals.icon}
                          </div>

                          {/* Nombre del evento, Código de Reserva y Descripción */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-xs">
                                {eventTitle}
                              </span>
                              {evt.reservationId && (
                                <span className="font-mono text-[#0062FF] font-semibold text-xs hover:underline cursor-pointer">
                                  {evt.reservationId}
                                </span>
                              )}
                              {evt.guestName && (
                                <span className="text-gray-400 text-xs font-normal">
                                  · {evt.guestName}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-[11px] mt-0.5 truncate max-w-md">
                              {changeDescription}
                            </p>
                          </div>
                        </div>

                        {/* BLOQUE DERECHO: Usuario/Rol + Badge de Estado + Botón JSON */}
                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                          {/* Usuario Responsable y Origen */}
                          <div className="text-left md:text-right">
                            <span className="font-semibold text-gray-800 text-xs block">
                              {evt.user || 'Sistema'}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              {evt.actorRole || (evt.ip ? `IP: ${evt.ip}` : '—')}
                            </span>
                          </div>

                          {/* Badge de Estado */}
                          <div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase tracking-wide ${visuals.badgeBg}`}>
                              {evt.status || evt.action || '—'}
                            </span>
                          </div>

                          {/* Botón Ver JSON */}
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(evt)}
                            className="text-[11px] font-semibold text-[#0062FF] hover:bg-blue-50/80 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 cursor-pointer flex items-center gap-1"
                          >
                            <span>&#123; &#125;</span> Ver JSON
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Inspector de Payload JSON */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Inspector de evento</h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5">
                  {selectedEvent.id || '—'}
                  {selectedEvent.reservationId ? ` — Reserva ${selectedEvent.reservationId}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-7 h-7 rounded-full bg-gray-200/60 text-gray-600 hover:bg-gray-200 flex items-center justify-center font-bold transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Resumen de Transacción
                </span>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  {selectedEvent.details || 'Sin detalles adicionales registrados'}
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
                className="bg-[#0062FF] hover:bg-[#0052d4] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
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