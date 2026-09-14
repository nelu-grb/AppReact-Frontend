import { useEffect, useMemo, useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { getAuditEvents, type AuditEvent } from '../services/auditService';
import { parseApiError } from '../utils/errorHandler';

export default function Audit() {
  const { isAdmin, isAuditor } = useUserRole();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin && !isAuditor) return;
    getAuditEvents().then(setEvents).catch((loadError) => setError(parseApiError(loadError)));
  }, [isAdmin, isAuditor]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return events
      .filter((event) => !term || [event.eventType, event.aggregateId, event.actor, event.payload].some((value) => value.toLowerCase().includes(term)))
      .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime());
  }, [events, search]);

  if (!isAdmin && !isAuditor) return <PageMessage text="No tienes permisos para consultar auditoría." />;
  if (error) return <PageMessage text={error} />;

  return <main className="min-h-screen bg-[#F5F6F8] p-6 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto space-y-6">
      <header><h1 className="text-2xl font-bold text-gray-900">Auditoría</h1><p className="text-xs text-gray-500 mt-1">Eventos recibidos desde el servicio de auditoría.</p></header>
      <section className="bg-white p-4 rounded-xl border border-gray-200"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar evento, agregado o actor..." className="w-full max-w-md px-3 py-2 text-xs border border-gray-200 rounded-lg" /></section>
      <section className="bg-white rounded-xl border border-gray-200 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-gray-50 text-[10px] uppercase text-gray-400"><tr><th className="px-6 py-3">Evento</th><th className="px-6 py-3">Agregado</th><th className="px-6 py-3">Actor</th><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Payload</th></tr></thead><tbody className="divide-y divide-gray-100">{filtered.map((event) => <tr key={event.id}><td className="px-6 py-4 font-semibold">{event.eventType}</td><td className="px-6 py-4">{event.aggregateId}</td><td className="px-6 py-4">{event.actor || 'Sin actor'}</td><td className="px-6 py-4">{new Date(event.timestamp).toLocaleString('es-CL')}</td><td className="px-6 py-4"><button type="button" onClick={() => setSelected(event)} className="text-[#1A423B] font-semibold">Ver JSON</button></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-xs text-gray-400">No hay eventos disponibles.</p>}</section>
      {selected && <div className="fixed inset-0 z-50 bg-gray-900/40 flex items-center justify-center p-4"><div className="bg-white rounded-xl max-w-2xl w-full p-6"><div className="flex justify-between"><h2 className="font-bold text-sm">Evento #{selected.id}</h2><button type="button" onClick={() => setSelected(null)}>Cerrar</button></div><pre className="mt-4 bg-gray-900 text-emerald-400 p-4 rounded-lg text-xs overflow-auto max-h-96">{selected.payload}</pre></div></div>}
    </div>
  </main>;
}

function PageMessage({ text }: { text: string }) { return <main className="min-h-screen bg-[#F5F6F8] p-8 font-sans"><p className="max-w-7xl mx-auto text-sm text-gray-500">{text}</p></main>; }
