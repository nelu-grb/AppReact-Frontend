import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useUserRole } from '../hooks/useUserRole';

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  unitName: string;
  checkInDate: string;
  checkOutDate: string;
  channel: 'Web' | 'Instagram' | 'WhatsApp' | 'Directo';
  status: 'CREADA' | 'CONFIRMADA' | 'CHECKIN_PENDIENTE' | 'EN_ESTADÍA' | 'CHECKOUT' | 'CANCELADA';
  amount: string;
}

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: '1',
    code: 'R-2024-0894',
    guestName: 'Carlos Mendoza',
    unitName: 'Cabaña Bosque Nativo #4',
    checkInDate: '2026-09-05',
    checkOutDate: '2026-09-08',
    channel: 'Web',
    status: 'CREADA',
    amount: '$210.000',
  },
  {
    id: '2',
    code: 'R-2024-0893',
    guestName: 'Valentina Silva',
    unitName: 'Habitación Vista Volcán #102',
    checkInDate: '2026-09-04',
    checkOutDate: '2026-09-07',
    channel: 'Instagram',
    status: 'CONFIRMADA',
    amount: '$145.000',
  },
  {
    id: '3',
    code: 'R-2024-0891',
    guestName: 'Carlos Núñez',
    unitName: 'Lodge Termas del Valle #1',
    checkInDate: '2026-09-04',
    checkOutDate: '2026-09-06',
    channel: 'Directo',
    status: 'EN_ESTADÍA',
    amount: '$180.000',
  },
  {
    id: '4',
    code: 'R-2024-0887',
    guestName: 'Huesped Prueba',
    unitName: 'Habitación Estándar #08',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-03',
    channel: 'Web',
    status: 'CHECKOUT',
    amount: '$95.000',
  },
];

export default function Reservations() {
  const { fullName, isAdmin, isRecepcionista } = useUserRole();
  const canManageStatus = isAdmin || isRecepcionista;

  // Estado principal de reservas
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Control del modal de nueva reserva
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    guestName: fullName || '',
    unitName: 'Cabaña Bosque Nativo #4',
    checkInDate: '',
    checkOutDate: '',
    channel: 'Web' as Reservation['channel'],
    amount: '$120.000',
  });

  // Manejador para avanzar o cancelar el ciclo de vida de la reserva
  const handleUpdateStatus = (id: string, nextStatus: Reservation['status']) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );
  };

  // Manejador para crear nueva reserva
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.checkInDate || !formData.checkOutDate) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newReservation: Reservation = {
      id: Date.now().toString(),
      code: `R-2026-${randomNum}`,
      guestName: formData.guestName,
      unitName: formData.unitName,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      channel: formData.channel,
      status: 'CREADA',
      amount: formData.amount,
    };

    setReservations((prev) => [newReservation, ...prev]);
    setIsModalOpen(false);
    setFormData({
      guestName: fullName || '',
      unitName: 'Cabaña Bosque Nativo #4',
      checkInDate: '',
      checkOutDate: '',
      channel: 'Web',
      amount: '$120.000',
    });
  };

  // Filtrado reactivo
  const filteredReservations = reservations.filter((res) => {
    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || res.channel === channelFilter;
    const matchesSearch =
      res.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.unitName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesChannel && matchesSearch;
  });

  // Estilos según el estado
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
  Para dejar la página de **Reservations** 100% operativa, la estructuramos en tres partes: control de estado con filtros reactivos (estado y canal), tabla de visualización dinámica y un modal con formulario para crear nuevas reservas.

Aquí tienes el componente completo listo para integrar (adaptado para React/TypeScript con Tailwind CSS):

```tsx
import React, { useState, useMemo } from 'react';

// Tipos
export type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'CHECKED_IN';
export type ReservationChannel = 'DIRECT' | 'BOOKING' | 'AIRBNB' | 'EXPEDIA';

export interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomNumber: string;
  channel: ReservationChannel;
  status: ReservationStatus;
  totalAmount: number;
}

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'RES-001', guestName: 'Carlos Mendoza', checkIn: '2026-09-10', checkOut: '2026-09-15', roomNumber: '102', channel: 'BOOKING', status: 'CONFIRMED', totalAmount: 450 },
  { id: 'RES-002', guestName: 'Elena Rostova', checkIn: '2026-09-12', checkOut: '2026-09-14', roomNumber: '205', channel: 'AIRBNB', status: 'PENDING', totalAmount: 220 },
  { id: 'RES-003', guestName: 'Felipe Araya', checkIn: '2026-09-08', checkOut: '2026-09-11', roomNumber: '301', channel: 'DIRECT', status: 'CHECKED_IN', totalAmount: 310 },
  { id: 'RES-004', guestName: 'Ana Silva', checkIn: '2026-09-05', checkOut: '2026-09-07', roomNumber: '104', channel: 'EXPEDIA', status: 'CANCELLED', totalAmount: 180 },
];

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    checkIn: '',
    checkOut: '',
    roomNumber: '',
    channel: 'DIRECT' as ReservationChannel,
    status: 'CONFIRMED' as ReservationStatus,
    totalAmount: '',
  });

  // Filtrado reactivo en memoria
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchStatus = statusFilter === 'ALL' || res.status === statusFilter;
      const matchChannel = channelFilter === 'ALL' || res.channel === channelFilter;
      return matchStatus && matchChannel;
    });
  }, [reservations, statusFilter, channelFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.checkIn || !formData.checkOut || !formData.roomNumber) return;

    const newRes: Reservation = {
      id: `RES-${String(reservations.length + 1).padStart(3, '0')}`,
      guestName: formData.guestName,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      roomNumber: formData.roomNumber,
      channel: formData.channel,
      status: formData.status,
      totalAmount: Number(formData.totalAmount) || 0,
    };

    setReservations([newRes, ...reservations]);
    setIsModalOpen(false);
    setFormData({
      guestName: '',
      checkIn: '',
      checkOut: '',
      roomNumber: '',
      channel: 'DIRECT',
      status: 'CONFIRMED',
      totalAmount: '',
    });
  };

  const getStatusBadge = (status: ReservationStatus) => {
    const styles: Record<ReservationStatus, string> = {
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      CHECKED_IN: 'bg-blue-100 text-blue-800 border-blue-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservaciones</h1>
          <p className="text-sm text-slate-500">Administra, filtra y crea reservas de huéspedes.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          + Nueva Reserva
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filtrar por Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filtrar por Canal</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">Todos los canales</option>
            <option value="DIRECT">DIRECT</option>
            <option value="BOOKING">BOOKING</option>
            <option value="AIRBNB">AIRBNB</option>
            <option value="EXPEDIA">EXPEDIA</option>
          </select>
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">ID / Huésped</th>
                <th className="px-6 py-3">Fechas</th>
                <th className="px-6 py-3">Habitación</th>
                <th className="px-6 py-3">Canal</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{res.guestName}</div>
                      <div className="text-xs text-slate-400">{res.id}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div><span className="font-semibold">In:</span> {res.checkIn}</div>
                      <div><span className="font-semibold">Out:</span> {res.checkOut}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-800">#{res.roomNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{res.channel}</td>
                    <td className="px-6 py-4">{getStatusBadge(res.status)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">${res.totalAmount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    No se encontraron reservas con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva Reserva */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Registrar Nueva Reserva</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Huésped</label>
                <input
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej. Matías Vidal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    required
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">N° Habitación</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. 204"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Total ($)</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. 350"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Canal</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as ReservationChannel })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DIRECT">DIRECT</option>
                    <option value="BOOKING">BOOKING</option>
                    <option value="AIRBNB">AIRBNB</option>
                    <option value="EXPEDIA">EXPEDIA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado Inicial</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ReservationStatus })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Guardar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};