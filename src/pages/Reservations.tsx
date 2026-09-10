import { useState, useEffect } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { formatCLP, cleanCLP } from '../utils/formatters';
import { 
  createReservation, 
  getReservations, 
  updateReservationStatus,
  type ReservationRequest,
  type ReservationResponse
} from '../services/reservationService';

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  unitName: string;
  checkInDate: string;
  checkOutDate: string;
  channel: 'Web' | 'Instagram' | 'WhatsApp' | 'Directo';
  status: 'CREADA' | 'CONFIRMADA' | 'CHECKIN_PENDIENTE' | 'EN_ESTADÍA' | 'CHECKOUT' | 'CANCELADA';
  amount: string;
}

// Catálogo de unidades: Única fuente de verdad en el cliente
export const AVAILABLE_UNITS = [
  { id: 1, name: 'Cabaña Bosque Nativo #4', location: 'Pucón' },
  { id: 2, name: 'Habitación Vista Volcán #102', location: 'Puerto Varas' },
  { id: 3, name: 'Lodge Termas del Valle #1', location: 'Curacautín' },
  { id: 4, name: 'Habitación Estándar #08', location: 'San Pedro' },
];

export default function Reservations() {
  const { fullName, isAdmin, isRecepcionista } = useUserRole();
  const canManageStatus = isAdmin || isRecepcionista;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestName: fullName || '',
    guestEmail: '',
    unitId: 1, // Se almacena directamente el ID numérico
    checkInDate: '',
    checkOutDate: '',
    channel: 'Web' as Reservation['channel'],
    amount: '$120.000',
  });

  // Cargar reservas desde Spring Boot
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getReservations();
      
      if (Array.isArray(data)) {
        const mapped: Reservation[] = data.map((item: ReservationResponse) => {
          const matchedUnit = AVAILABLE_UNITS.find((u) => u.id === Number(item.unitId));
          return {
            id: String(item.id || item.code || Date.now()),
            code: item.code || `R-2026-${item.id || '000'}`,
            guestName: item.guestName || item.guestId || 'Huésped',
            guestEmail: item.guestEmail || 'sin-email@dominio.com',
            unitName: item.unitName || matchedUnit?.name || `Unidad #${item.unitId}`,
            checkInDate: item.startDate,
            checkOutDate: item.endDate,
            channel: (item.channel as Reservation['channel']) || 'Web',
            status: item.status || 'CREADA',
            amount: String(item.totalAmount ?? 0),
          };
        });
        setReservations(mapped);
      }
    } catch (error) {
      console.warn('Backend aún sin datos o error de conexión, manteniendo vista local:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // Sincronizar actualización de estado con el backend
  const handleUpdateStatus = async (id: string, nextStatus: Reservation['status']) => {
    try {
      await updateReservationStatus(id, nextStatus);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    } catch (error) {
      console.error('Error al actualizar estado en el servidor:', error);
      alert('Error de conexión al actualizar el estado de la reserva.');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.guestName || !formData.guestEmail || !formData.checkInDate || !formData.checkOutDate || !formData.amount) {
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

    // Payload directo garantizando unitId como integer
    const payload: ReservationRequest = {
      unitId: formData.unitId,
      guestName: formData.guestName,
      guestEmail: formData.guestEmail,
      startDate: formData.checkInDate,
      endDate: formData.checkOutDate,
      totalAmount: numericAmount,
      channel: formData.channel,
    };

    try {
      const backendResponse = await createReservation(payload);
      const selectedUnit = AVAILABLE_UNITS.find((u) => u.id === formData.unitId);

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newReservation: Reservation = {
        id: String(backendResponse?.id || Date.now()),
        code: backendResponse?.code || `R-2026-${randomNum}`,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        unitName: selectedUnit ? selectedUnit.name : `Unidad #${formData.unitId}`,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        channel: formData.channel,
        status: 'CREADA',
        amount: formData.amount,
      };

      setReservations((prev) => [newReservation, ...prev]);
      setIsModalOpen(false);

      // Limpiar el formulario reseteando al unitId inicial
      setFormData({
        guestName: fullName || '',
        guestEmail: '',
        unitId: 1,
        checkInDate: '',
        checkOutDate: '',
        channel: 'Web',
        amount: '$120.000',
      });

      alert('¡Reserva creada y guardada en base de datos con éxito!');
    } catch (error) {
      console.error('Error al guardar en el backend:', error);
      alert('Error de conexión al guardar la reserva en el servidor.');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || res.channel === channelFilter;
    const matchesSearch =
      res.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.unitName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'CREADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CHECKIN_PENDIENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'EN_ESTADÍA':
        return 'bg-[#1A423B]/10 text-[#1A423B] border-[#1A423B]/20 font-bold';
      case 'CHECKOUT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'CANCELADA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Reservas</h1>
            <p className="text-sm text-gray-500 mt-1">
              Control del ciclo de vida de estadías y asignaciones en tiempo real.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData((prev: any) => ({ ...prev, guestName: fullName || '' }));
              setIsModalOpen(true);
            }}
            className="bg-[#CB6D51] hover:bg-[#b85e44] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Reserva
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por código, huésped o unidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A423B]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Estado:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A423B]"
              >
                <option value="ALL">Todos</option>
                <option value="CREADA">CREADA</option>
                <option value="CONFIRMADA">CONFIRMADA</option>
                <option value="CHECKIN_PENDIENTE">CHECKIN_PENDIENTE</option>
                <option value="EN_ESTADÍA">EN_ESTADÍA</option>
                <option value="CHECKOUT">CHECKOUT</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Canal:</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A423B]"
              >
                <option value="ALL">Todos</option>
                <option value="Web">Web</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Directo">Directo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Reservas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Código / Huésped</th>
                  <th className="px-6 py-3.5">Alojamiento</th>
                  <th className="px-6 py-3.5">Fechas</th>
                  <th className="px-6 py-3.5">Canal</th>
                  <th className="px-6 py-3.5">Monto</th>
                  <th className="px-6 py-3.5">Estado</th>
                  {canManageStatus && <th className="px-6 py-3.5 text-right">Acciones Operador</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={canManageStatus ? 7 : 6} className="px-6 py-8 text-center text-gray-400 text-sm">
                      Cargando reservas desde la base de datos...
                    </td>
                  </tr>
                ) : filteredReservations.length > 0 ? (
                  filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{res.guestName}</div>
                        <div className="text-xs font-mono text-gray-500">{res.code}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{res.unitName}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        <div><span className="font-semibold">In:</span> {res.checkInDate}</div>
                        <div><span className="font-semibold">Out:</span> {res.checkOutDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {res.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCLP(res.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded border ${getStatusBadge(res.status)}`}>
                          {res.status}
                        </span>
                      </td>
                      {canManageStatus && (
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {res.status === 'CREADA' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'CONFIRMADA')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm transition-colors"
                              >
                                Confirmar
                              </button>
                            )}

                            {(res.status === 'CONFIRMADA' || res.status === 'CHECKIN_PENDIENTE') && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'EN_ESTADÍA')}
                                className="bg-[#1A423B] hover:bg-[#255e54] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm transition-colors"
                              >
                                Check-In
                              </button>
                            )}

                            {res.status === 'EN_ESTADÍA' && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'CHECKOUT')}
                                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm transition-colors"
                              >
                                Check-Out
                              </button>
                            )}

                            {(res.status === 'CREADA' || res.status === 'CONFIRMADA') && (
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'CANCELADA')}
                                className="text-rose-600 hover:bg-rose-50 text-xs font-semibold px-2 py-1 rounded transition-colors"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canManageStatus ? 7 : 6} className="px-6 py-8 text-center text-gray-400 text-sm">
                      No se encontraron reservas con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Nueva Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Crear Nueva Reserva</h2>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Huésped</label>
                <input
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico Huésped</label>
                <input
                  type="email"
                  required
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unidad / Habitación</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                >
                  {AVAILABLE_UNITS.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Entrada</label>
                  <input
                    type="date"
                    required
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Salida</label>
                  <input
                    type="date"
                    required
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Canal de Origen</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as Reservation['channel'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  >
                    <option value="Web">Web</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Directo">Directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Estimado</label>
                  <input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                    placeholder="$120.000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#CB6D51] hover:bg-[#b85e44] rounded-lg shadow-sm transition-colors"
                >
                  Crear Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}