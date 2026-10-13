import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCLP, cleanCLP } from '../utils/formatters';
import { AsyncStateHandler } from '../utils/AsyncStateHandler';
import { parseApiError } from '../utils/errorHandler';
import { 
  getReservations, 
  updateReservationStatus,
  type ReservationRequest,
  type ReservationResponse
} from '../services/reservationService';
import { initiateWebpayCheckout } from '../services/webpayService';
import { createReservation } from '../services/reservationService';

export interface Reservation {
  id: string;
  code: string;
  guestId: string;
  guestEmail: string;
  unitName: string;
  checkInDate: string;
  checkOutDate: string;
  channel: 'Web' | 'Instagram' | 'WhatsApp' | 'Directo';
  status: 'CREADA' | 'CONFIRMADA' | 'CHECKIN_PENDIENTE' | 'EN_ESTADÍA' | 'CHECKOUT' | 'CANCELADA';
  amount: string;
}

const AVAILABLE_UNITS = [
  { id: 1, name: 'Suite Andes', location: 'Habitación 301' },
  { id: 2, name: 'Doble Superior', location: 'Habitación 204' },
  { id: 3, name: 'Suite Andes', location: 'Habitación 302' },
  { id: 4, name: 'Doble Superior', location: 'Habitación 202' },
];

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function Reservations() {
  const { fullName, isAdmin, isRecepcionista } = useAuth();
  
  // VARIABLE CLAVE: Determina si se muestra la UI de Admin o de Huésped
  const canManageStatus = isAdmin || isRecepcionista;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    guestId: fullName || '',
    guestEmail: '',
    unitId: 1,
    checkInDate: '',
    checkOutDate: '',
    channel: 'Directo' as Reservation['channel'],
    amount: '$120.000',
  });

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReservations();
      
      if (Array.isArray(data)) {
        const mapped: Reservation[] = data.map((item: ReservationResponse) => {
          const matchedUnit = AVAILABLE_UNITS.find((u) => u.id === Number(item.unitId));
          return {
            id: String(item.id || item.code || Date.now()),
            code: item.code || `AS-${item.id || Math.floor(1000 + Math.random() * 9000)}`,
            guestId: item.guestId || 'Huésped',
            guestEmail: item.guestEmail || 'correo@dominio.com',
            unitName: item.unitName || matchedUnit?.name || `Unidad #${item.unitId}`,
            checkInDate: item.startDate,
            checkOutDate: item.endDate,
            channel: (item.channel as Reservation['channel']) || 'Directa',
            status: item.status || 'CREADA',
            amount: String(item.totalAmount ?? 0),
          };
        });
        setReservations(mapped);
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleUpdateStatus = async (id: string, nextStatus: Reservation['status']) => {
    try {
      setUpdatingReservationId(id);
      await updateReservationStatus(id, nextStatus);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestId || !formData.guestEmail || !formData.checkInDate || !formData.checkOutDate || !formData.amount) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }
    if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
      alert('La fecha de salida debe ser posterior a la fecha de entrada.');
      return;
    }
    const numericAmount = cleanCLP(formData.amount);
    if (numericAmount <= 0) {
      alert('El monto debe ser superior a $0.');
      return;
    }

    const payload: ReservationRequest = {
      unitId: formData.unitId,
      guestId: formData.guestId,
      guestEmail: formData.guestEmail,
      startDate: formData.checkInDate,
      endDate: formData.checkOutDate,
      totalAmount: numericAmount,
      channel: formData.channel,
    };

    try {
      setIsCreating(true);
      const newReservation = await createReservation(payload);
      const { url, token } = await initiateWebpayCheckout(newReservation.id);
      if (!url || !token) throw new Error('El backend no devolvió la URL y el token de Webpay.');

      const transbankUrl = new URL(url);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = transbankUrl.toString();

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = token;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert(err instanceof Error ? err.message : parseApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
      const matchesSearch =
        res.guestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.unitName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const confirmadas = reservations.filter(r => r.status === 'CONFIRMADA' || r.status === 'EN_ESTADÍA');
    const llegadas = reservations.filter(r => r.status === 'CREADA' || r.status === 'CHECKIN_PENDIENTE');
    const totalIngresos = confirmadas.reduce((acc, curr) => acc + Number(cleanCLP(curr.amount)), 0);
    
    return {
      total: reservations.length,
      confirmadas: confirmadas.length,
      llegadasHoy: llegadas.length,
      ingresosTotales: totalIngresos
    };
  }, [reservations]);

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'CREADA': return 'bg-[#EBF5FF] text-[#0066FF]';
      case 'CONFIRMADA': return 'bg-[#E6F4EA] text-[#1E8E3E]';
      case 'CHECKIN_PENDIENTE': 
      case 'EN_ESTADÍA': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'CHECKOUT': return 'bg-[#F3F4F6] text-[#4B5563]';
      case 'CANCELADA': return 'bg-[#FCE8E8] text-[#D93025]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans text-gray-900">
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 space-y-6">
        
{/* ENCABEZADO CONDICIONAL */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span>Hotel Cordillera · Santiago, Chile</span>
            </div>
            
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {canManageStatus ? 'Gestión de Reservas' : 'Mis Reservas'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {canManageStatus 
                ? 'Todo listo para una gran estadía. Gestiona cada reserva en un solo lugar.'
                : 'Revisa el detalle y estado de tus próximas estadías.'}
            </p>
          </div>
          
          {/* Se eliminó md:items-center del padre y se agregó md:mt-6 para empujar el botón hacia abajo */}
          <div className="flex items-center gap-3 md:mt-6">
            {canManageStatus && (
              <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Exportar
              </button>
            )}
            
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, guestId: fullName || '' }));
                setIsModalOpen(true);
              }}
              className="bg-[#0066FF] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva reserva
            </button>
          </div>
        </div>


        {/* TABLA DE RESERVAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto">
              <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Todas · {reservations.length}
              </button>
              <button onClick={() => setStatusFilter('CONFIRMADA')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'CONFIRMADA' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Confirmadas · {reservations.filter(r => r.status === 'CONFIRMADA').length}
              </button>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:w-64">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder={canManageStatus ? "Buscar huésped o reserva" : "Buscar por código"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <AsyncStateHandler loading={loading} error={error} isEmpty={reservations.length === 0} emptyMessage="No hay reservas registradas." onRetry={fetchReservations}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                    <th className="px-6 py-4">{canManageStatus ? 'Huésped / Reserva' : 'Detalle Reserva'}</th>
                    <th className="px-6 py-4">Estadía</th>
                    <th className="px-6 py-4">Alojamiento</th>
                    {canManageStatus && <th className="px-6 py-4">Canal</th>}
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    {canManageStatus && <th className="px-4 py-4 w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReservations.map((res) => {
                    const matchedUnit = AVAILABLE_UNITS.find(u => u.name === res.unitName) || { location: 'Por asignar' };
                    
                    return (
                      <tr key={res.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                              {getInitials(res.guestId)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{res.guestId}</div>
                              <div className="text-xs text-gray-400">
                                {res.code} {canManageStatus && `· ${res.guestEmail}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {res.checkInDate} <span className="text-gray-400 font-normal mx-1">→</span> {res.checkOutDate}
                          </div>
                          <div className="text-xs text-gray-400">2 noches · 2 adultos</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{res.unitName}</div>
                          <div className="text-xs text-gray-400">{matchedUnit.location}</div>
                        </td>
                        {canManageStatus && (
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">{res.channel}</span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${getStatusBadge(res.status)}`}>
                            {res.status === 'EN_ESTADÍA' ? 'CHECK-IN' : res.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                          {formatCLP(res.amount).replace('$', 'US$ ')}
                        </td>
                        {canManageStatus && (
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {updatingReservationId === res.id ? (
                                <span className="text-xs text-blue-500 animate-pulse">...</span>
                              ) : (
                                <>
                                  {res.status === 'CREADA' && (
                                    <button onClick={() => handleUpdateStatus(res.id, 'CONFIRMADA')} className="text-xs text-green-600 hover:bg-green-50 px-2 py-1 rounded font-medium">
                                      Confirmar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AsyncStateHandler>
          
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div>Mostrando {filteredReservations.length} de {reservations.length} reservas</div>
          </div>
        </div>
      </main>

      {/* Modal Nueva Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Nueva Reserva</h2>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Huésped</label>
                <input type="text" required value={formData.guestId} onChange={(e) => setFormData({ ...formData, guestId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" required value={formData.guestEmail} onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alojamiento</label>
                <select value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all bg-white">
                  {AVAILABLE_UNITS.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.location})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input type="date" required value={formData.checkInDate} onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                  <input type="date" required value={formData.checkOutDate} onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
                  <select value={formData.channel} onChange={(e) => setFormData({ ...formData, channel: e.target.value as Reservation['channel'] })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all bg-white">
                    <option value="Directo">Directo</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Web">Web</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto Estimado</label>
                  <input type="text" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" placeholder="$120.000" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isCreating} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating} className="px-5 py-2.5 text-sm font-medium text-white bg-[#0066FF] hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                  {isCreating ? 'Conectando...' : 'Ir a Pagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}