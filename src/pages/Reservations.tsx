import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCLP, cleanCLP } from '../utils/formatters';
import { AsyncStateHandler } from '../utils/AsyncStateHandler';
import { parseApiError } from '../utils/errorHandler';
import { 
  getReservations, 
  createReservation,
  updateReservationStatus,
  type ReservationRequest,
  type ReservationResponse
} from '../services/reservationService';
import { initiateWebpayCheckout } from '../services/webpayService';
import apiClient from '../services/apiClient';

import { API_ENDPOINTS } from '../config/apiConfig';


export interface Reservation {
  id: string;
  code: string;
  guestId: string;
  guestEmail: string;
  unitName: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'CREADA' | 'CONFIRMADA' | 'CHECKIN_PENDIENTE' | 'EN_ESTADIA' | 'CHECKOUT' | 'CANCELADA';
  amount: string;
}

const reservationStatusFilters: Array<{ status: Reservation['status']; label: string }> = [
  { status: 'CREADA', label: 'Creadas' },
  { status: 'CONFIRMADA', label: 'Confirmadas' },
  { status: 'CHECKIN_PENDIENTE', label: 'Check-in pendiente' },
  { status: 'EN_ESTADIA', label: 'En estadía' },
  { status: 'CHECKOUT', label: 'Check-out' },
  { status: 'CANCELADA', label: 'Canceladas' },
];

const confirmedReservationStatuses = new Set([
  'CONFIRMADA',
  'CHECKIN_PENDIENTE',
  'EN_ESTADIA',
  'CHECKOUT',
]);

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const normalizeStatus = (status: string) =>
  status.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const isInStayStatus = (status: string) => normalizeStatus(status) === 'EN_ESTADIA';

type ReservationAction = {
  label: string;
  nextStatus: Reservation['status'];
  danger?: boolean;
};

// Transiciones permitidas por el backend (ReservationStatus.canTransitionTo)
const getAvailableActions = (status: Reservation['status']): ReservationAction[] => {
  switch (normalizeStatus(status)) {
    case 'CREADA':
      return [{ label: 'Cancelar reserva', nextStatus: 'CANCELADA', danger: true }];
    case 'CONFIRMADA':
      return [
        { label: 'Registrar pago recibido', nextStatus: 'CHECKIN_PENDIENTE' },
        { label: 'Realizar check-in', nextStatus: 'EN_ESTADIA' },
        { label: 'Cancelar reserva', nextStatus: 'CANCELADA', danger: true },
      ];
    case 'CHECKIN_PENDIENTE':
      return [{ label: 'Realizar check-in', nextStatus: 'EN_ESTADIA' }];
    case 'EN_ESTADIA':
      return [{ label: 'Realizar check-out', nextStatus: 'CHECKOUT' }];
    default:
      return [];
  }
};

export default function Reservations() {
  const { fullName, userEmail, isAdmin, isRecepcionista, isHuesped } = useAuth();
  const canManageStatus = isAdmin || isRecepcionista;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [payingReservationId, setPayingReservationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Estado crucial para que funcione el botón
  const [isModalOpen, setIsModalOpen] = useState(false);


  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    guestId: fullName || '',
    guestEmail: '',
    unitId: 1,
    checkInDate: '',
    checkOutDate: '',
    amount: '$120.000',
  });

 const fetchReservations = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getReservations();

    if (Array.isArray(data)) {
      const mapped: Reservation[] = data.map((item: ReservationResponse) => {
        // Extraemos el ID numérico/string de la reserva y del catálogo flexiblemente
        const resUnitId = String(item.unitId ?? item.unit?.id ?? '');

        // Buscamos coincidencia en el catálogo disponible
        const matchedUnit = availableUnits.find(
          (u: any) => String(u.unitId ?? u.id) === resUnitId
        );

        return {
          id: String(item.id || item.code || Date.now()),
          code: item.code || `AS-${item.id || Math.floor(1000 + Math.random() * 9000)}`,
          guestId: item.guestId || 'Huésped',
          guestEmail: item.guestEmail || 'correo@dominio.com',
          // Prioridad: 1. unitName directo, 2. Nombre desde catálogo matchedUnit, 3. Fallback
          unitName: item.unitName || matchedUnit?.name || (resUnitId ? `Unidad #${resUnitId}` : 'Sin Asignar'),
          checkInDate: item.startDate,
          checkOutDate: item.endDate,
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
}, [availableUnits]); 

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

  // Cierra el menú de acciones al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => setOpenMenuId(null);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const handleActionClick = (reservation: Reservation, action: ReservationAction) => {
    setOpenMenuId(null);
    if (
      action.danger &&
      !window.confirm(
        `¿Cancelar la reserva de ${reservation.guestId} (${reservation.code})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    handleUpdateStatus(reservation.id, action.nextStatus);
  };

  const handlePayReservation = async (reservationId: string) => {
    try {
      setPayingReservationId(reservationId);

      const { url, token } = await initiateWebpayCheckout(reservationId);
      if (!url || !token) {
        throw new Error('El backend no devolvió la URL y el token de Webpay.');
      }

      const paymentUrl = new URL(url);
      if (paymentUrl.protocol !== 'https:' && paymentUrl.protocol !== 'http:') {
        throw new Error('El backend devolvió una URL de pago no válida.');
      }

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl.toString();

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = token;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert(err instanceof Error ? err.message : parseApiError(err));
      setPayingReservationId(null);
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
    };

    try {
      setIsCreating(true);
      await createReservation(payload);
      setIsModalOpen(false);
      await fetchReservations();
    } catch (err) {
      alert(err instanceof Error ? err.message : parseApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchesStatus =
        statusFilter === 'ALL' || normalizeStatus(res.status) === normalizeStatus(statusFilter);
      const matchesSearch =
        res.guestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.unitName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const monthLabel = new Intl.DateTimeFormat('es-CL', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    const approvalPending = reservations.filter(
      (reservation) => normalizeStatus(reservation.status) === 'CREADA'
    ).length;
    const activeStays = reservations.filter(
      (reservation) => isInStayStatus(reservation.status)
    ).length;
    const confirmedReservations = reservations.filter((reservation) =>
      confirmedReservationStatuses.has(normalizeStatus(reservation.status))
    );
    const confirmedValue = confirmedReservations.reduce(
      (total, reservation) => total + cleanCLP(reservation.amount),
      0
    );

    return {
      total: reservations.length,
      approvalPending,
      activeStays,
      confirmedValue,
      monthLabel: `${monthLabel.charAt(0).toLocaleUpperCase('es-CL')}${monthLabel.slice(1)}`,
    };
  }, [reservations]);

  const getStatusBadge = (status: Reservation['status']) => {
    switch (normalizeStatus(status)) {
      case 'CREADA': return 'bg-[#EBF5FF] text-[#0066FF]';
      case 'CONFIRMADA': return 'bg-[#E6F4EA] text-[#1E8E3E]';
      case 'CHECKIN_PENDIENTE': 
      case 'EN_ESTADIA': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'CHECKOUT': return 'bg-[#F3F4F6] text-[#4B5563]';
      case 'CANCELADA': return 'bg-[#FCE8E8] text-[#D93025]';
      default: return 'bg-gray-100 text-gray-600';
    }
  };


  // 2. Traer las cabañas al cargar la página para llenar el "Select"
  useEffect(() => {
    const fetchUnitsForModal = async () => {
      try {
        // Reemplaza con tu ruta de API, ej: API_ENDPOINTS.catalog.list
        const response = await apiClient.get(API_ENDPOINTS.catalog.list);
        const unitsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.content || []);
        
        setAvailableUnits(unitsData);
      } catch (error) {
        console.error("Error al cargar habitaciones para el modal:", error);
      }
    };
    fetchUnitsForModal();
  }, []);

  // 3. Autocalcular el precio cuando cambian las fechas o la cabaña
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate && formData.unitId) {
      const start = new Date(formData.checkInDate);
      const end = new Date(formData.checkOutDate);
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const noches = diffDays > 0 ? diffDays : 1;

      // Buscar la cabaña elegida en nuestro estado
      const cabana = availableUnits.find((u: any) => 
        String(u.unitId) === String(formData.unitId) || String(u.id) === String(formData.unitId)
      );
      
      const precioPorNoche = cabana?.pricePerNight || cabana?.price || 0; 
      const totalCalculado = (noches * precioPorNoche).toString();

      setFormData(prev => {
        if (prev.amount !== totalCalculado) {
          return { ...prev, amount: totalCalculado };
        }
        return prev;
      });
    }
  }, [formData.checkInDate, formData.checkOutDate, formData.unitId, availableUnits]);

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans text-gray-900">
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span>Hotel Cordillera · Santiago, Chile</span>
            </div>
            
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Gestión de Reservas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Todo listo para una gran estadía. Gestiona cada reserva en un solo lugar.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Exportar
            </button>
            
            <button
              onClick={() => {
                // Huésped: se precargan los datos de su cuenta (el backend usará esos).
                // Recepción/Admin: campos vacíos para escribir los datos del huésped real.
                setFormData((prev) => ({
                  ...prev,
                  guestId: canManageStatus ? '' : fullName || '',
                  guestEmail: canManageStatus ? '' : userEmail || '',
                }));
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

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Total de reservas</span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.total}</div>
              <div className="text-xs text-gray-400 mt-1">Registradas en total</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Pendientes de aprobación</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.approvalPending}</div>
              <div className="text-xs text-gray-400 mt-1">Reservas creadas sin aprobar</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Estadías activas</span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.activeStays}</div>
              <div className="text-xs text-gray-400 mt-1">Reservas en estado de estadía</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Valor reservado</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{formatCLP(metrics.confirmedValue)}</div>
              <div className="text-xs text-gray-400 mt-1">
                Confirmadas y estadías no canceladas
              </div>
            </div>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Filtros */}
          <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="w-full lg:w-64">
              <label htmlFor="reservation-status-filter" className="sr-only">
                Filtrar por estado
              </label>
              <select
                id="reservation-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Todos los estados · {reservations.length}</option>
                {reservationStatusFilters.map(({ status, label }) => (
                  <option key={status} value={status}>
                    {label} · {reservations.filter((reservation) =>
                      normalizeStatus(reservation.status) === normalizeStatus(status)
                    ).length}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:w-64">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Buscar huésped o reserva"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {metrics.monthLabel}
              </button>
            </div>
          </div>

          <AsyncStateHandler loading={loading} error={error} isEmpty={reservations.length === 0} emptyMessage="No hay reservas registradas." onRetry={fetchReservations}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500">
                    <th className="px-6 py-4">Huésped / Reserva</th>
                    <th className="px-6 py-4">Estadía</th>
                    <th className="px-6 py-4">Alojamiento</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-4 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReservations.map((res, index) => {
                    const matchedUnit = availableUnits.find(u => u.name === res.unitName) || { location: 'Por asignar' };
                    const rowActions = canManageStatus ? getAvailableActions(res.status) : [];
                    const openUp = index >= filteredReservations.length - 2;

                    return (
                      <tr key={res.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                              {getInitials(res.guestId)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900">{res.guestId}</div>
                              <div className="text-xs text-gray-400">{res.code} · {res.guestEmail}</div>
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
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${getStatusBadge(res.status)}`}>
                            {isInStayStatus(res.status) ? 'CHECK-IN' : res.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                          {formatCLP(res.amount).replace('$', 'US$ ')}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {(canManageStatus || isHuesped) && (
                            <div className="flex items-center justify-end gap-2">
                              {updatingReservationId === res.id ? (
                                <span className="text-xs text-blue-500 animate-pulse">...</span>
                              ) : (
                                <>
                                  {isHuesped && res.status === 'CREADA' && (
                                    <span className="text-xs text-gray-500">
                                      En revisión por el administrador
                                    </span>
                                  )}
                                  {isHuesped && res.status === 'CONFIRMADA' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePayReservation(res.id)}
                                      disabled={payingReservationId === res.id}
                                      className="text-xs text-white bg-[#0066FF] hover:bg-blue-700 disabled:opacity-60 px-3 py-2 rounded-lg font-semibold"
                                    >
                                      {payingReservationId === res.id
                                        ? 'Conectando con Webpay…'
                                        : 'Pagar con Webpay'}
                                    </button>
                                  )}
                                  {isHuesped && res.status === 'CHECKIN_PENDIENTE' && (
                                    <span className="text-xs text-green-700 font-semibold">
                                      ¡Pagada! Lista para tu llegada.
                                    </span>
                                  )}
                                  {canManageStatus && normalizeStatus(res.status) === 'CREADA' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(res.id, 'CONFIRMADA')}
                                      disabled={updatingReservationId === res.id}
                                      className="text-xs text-green-600 hover:bg-green-50 disabled:opacity-60 px-2 py-1 rounded font-medium"
                                    >
                                      {updatingReservationId === res.id ? 'Aprobando…' : 'Aprobar'}
                                    </button>
                                  )}
                                  {rowActions.length > 0 && (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        aria-label="Acciones de la reserva"
                                        aria-haspopup="menu"
                                        aria-expanded={openMenuId === res.id}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setOpenMenuId(openMenuId === res.id ? null : res.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                                      >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                      </button>
                                      {openMenuId === res.id && (
                                        <div
                                          role="menu"
                                          className={`absolute right-0 z-20 w-56 rounded-xl border border-gray-100 bg-white py-1 shadow-lg ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                                        >
                                          {rowActions.map((action) => (
                                            <button
                                              key={action.label}
                                              type="button"
                                              role="menuitem"
                                              onClick={() => handleActionClick(res, action)}
                                              disabled={updatingReservationId === res.id}
                                              className={`block w-full px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                                                action.danger
                                                  ? 'text-red-600 hover:bg-red-50'
                                                  : 'text-gray-700 hover:bg-gray-50'
                                              }`}
                                            >
                                              {action.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AsyncStateHandler>
          
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div>Mostrando {filteredReservations.length} de {reservations.length} reservas · 25 por página</div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-[#EBF5FF] text-[#0066FF] font-medium">1</button>
              <button className="p-1 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            Todo sincronizado - Última actualización 10:42
          </div>
          <div>Zona horaria: Santiago (UTC-03:00)</div>
        </div>
      </main>

      {/* MODAL NUEVA RESERVA (Obligatorio para que el botón funcione) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Nueva Reserva</h2>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Huésped</label>
                <input
                  type="text"
                  required
                  readOnly={!canManageStatus}
                  value={formData.guestId}
                  onChange={(e) => setFormData({ ...formData, guestId: e.target.value })}
                  className={`w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none transition-all ${
                    canManageStatus
                      ? 'focus:ring-2 focus:ring-[#0066FF] focus:border-transparent'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  readOnly={!canManageStatus}
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                  className={`w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none transition-all ${
                    canManageStatus
                      ? 'focus:ring-2 focus:ring-[#0066FF] focus:border-transparent'
                      : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                  }`}
                />
                {!canManageStatus && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Se usarán los datos de tu cuenta para registrar esta reserva.
                  </p>
                )}
              </div>
<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alojamiento</label>
                <select 
                  value={formData.unitId} 
                  onChange={(e) => setFormData({ ...formData, unitId: Number(e.target.value) })} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] transition-all bg-white"
                  required
                >
                  <option value="">Seleccione una habitación...</option>
                  {availableUnits.map((unit) => (
                    <option key={unit.unitId || unit.id} value={unit.unitId || unit.id}>
                      {unit.name} - ${Number(unit.pricePerNight || 0).toLocaleString('es-CL')} / noche
                    </option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Estimado</label>
                <input
                  type="text"
                  readOnly
                  value={formData.amount ? `$${Number(formData.amount).toLocaleString('es-CL')}` : '$0'}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none bg-gray-50 text-gray-500 font-semibold cursor-not-allowed"
                  placeholder="$0"
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isCreating} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isCreating} className="px-5 py-2.5 text-sm font-medium text-white bg-[#0066FF] hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                  {isCreating ? 'Creando...' : 'Crear reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}