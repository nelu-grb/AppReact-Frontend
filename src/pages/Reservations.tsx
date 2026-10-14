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
  channel: 'Web' | 'Instagram' | 'WhatsApp' | 'Directo';
  status: 'CREADA' | 'CONFIRMADA' | 'CHECKIN_PENDIENTE' | 'EN_ESTADÍA' | 'CHECKOUT' | 'CANCELADA';
  amount: string;
}


const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const normalizeStatus = (status: string) =>
  status.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const getDateKey = (value: string) => {
  // Las fechas YYYY-MM-DD se mantienen como fecha local para evitar cambios por zona horaria.
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
  if (dateOnly) {
    const parsedDate = new Date(`${dateOnly}T00:00:00Z`);
    return Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateOnly
      ? null
      : dateOnly;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Reservations() {
  const { fullName, isAdmin, isRecepcionista, isHuesped } = useAuth();
  const canManageStatus = isAdmin || isRecepcionista;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [payingReservationId, setPayingReservationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado crucial para que funcione el botón
  const [isModalOpen, setIsModalOpen] = useState(false);


  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  
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
      channel: formData.channel,
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
      const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
      const matchesSearch =
        res.guestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.unitName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reservations, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    const now = new Date();
    const todayKey = getDateKey(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    );
    const confirmedReservations = reservations.filter(
      (reservation) => normalizeStatus(reservation.status) === 'CONFIRMADA'
    );

    // Las fechas visibles y el importe se presentan según la configuración local del proyecto (Chile/CLP).
    const monthLabel = new Intl.DateTimeFormat('es-CL', {
      month: 'long',
      year: 'numeric',
    }).format(now);
    const todayLabel = new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(now);

    // Calcula noches usando las fechas de entrada/salida; cada reserva se cuenta solo si ambas son válidas.
    const confirmedNights = confirmedReservations.reduce((total, reservation) => {
      const checkInKey = getDateKey(reservation.checkInDate);
      const checkOutKey = getDateKey(reservation.checkOutDate);
      if (!checkInKey || !checkOutKey) return total;

      const checkIn = Date.parse(`${checkInKey}T00:00:00Z`);
      const checkOut = Date.parse(`${checkOutKey}T00:00:00Z`);
      return checkOut > checkIn
        ? total + Math.round((checkOut - checkIn) / (24 * 60 * 60 * 1000))
        : total;
    }, 0);

    const totalRevenue = confirmedReservations.reduce(
      (total, reservation) => total + cleanCLP(reservation.amount),
      0
    );


    return {
      total: reservations.length,
      confirmed: confirmedReservations.length,
      confirmedPercentage: reservations.length
        ? Math.round((confirmedReservations.length / reservations.length) * 100)
        : 0,
      arrivalsToday: reservations.filter(
        (reservation) => getDateKey(reservation.checkInDate) === todayKey
      ).length,
      monthLabel: `${monthLabel.charAt(0).toLocaleUpperCase('es-CL')}${monthLabel.slice(1)}`,
      todayLabel: `${todayLabel.charAt(0).toLocaleUpperCase('es-CL')}${todayLabel.slice(1)}`,
      totalRevenue,
      confirmedNights,
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

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Reservas este mes</span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.total}</div>
              <div className="text-xs text-gray-400 mt-1">{metrics.monthLabel}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Confirmadas</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.confirmed}</div>
              <div className="text-xs text-gray-400 mt-1">{metrics.confirmedPercentage} % de las reservas</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Llegadas hoy</span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{metrics.arrivalsToday}</div>
              <div className="text-xs text-gray-400 mt-1">{metrics.todayLabel}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500">Ingresos confirmados</span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">{formatCLP(metrics.totalRevenue)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {metrics.confirmed} {metrics.confirmed === 1 ? 'reserva' : 'reservas'} · {metrics.confirmedNights} {metrics.confirmedNights === 1 ? 'noche' : 'noches'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Filtros */}
          <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto">
              <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Todas · {reservations.length}
              </button>
              <button onClick={() => setStatusFilter('CONFIRMADA')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'CONFIRMADA' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Confirmadas · {reservations.filter(r => r.status === 'CONFIRMADA').length}
              </button>
              <button onClick={() => setStatusFilter('CREADA')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'CREADA' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Creadas · {reservations.filter(r => r.status === 'CREADA').length}
              </button>
              <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
                Más estados
              </button>
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
                    <th className="px-6 py-4">Canal</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-4 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReservations.map((res) => {
                    const matchedUnit = availableUnits.find(u => u.name === res.unitName) || { location: 'Por asignar' };
                    
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
                          <span className="text-sm text-gray-500">{res.channel}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${getStatusBadge(res.status)}`}>
                            {res.status === 'EN_ESTADÍA' ? 'CHECK-IN' : res.status}
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
                                  {isAdmin && res.status === 'CREADA' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(res.id, 'CONFIRMADA')}
                                      disabled={updatingReservationId === res.id}
                                      className="text-xs text-green-600 hover:bg-green-50 disabled:opacity-60 px-2 py-1 rounded font-medium"
                                    >
                                      {updatingReservationId === res.id ? 'Aprobando…' : 'Aprobar'}
                                    </button>
                                  )}
                                  {canManageStatus && <button className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                  </button>}
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
                <input type="text" required value={formData.guestId} onChange={(e) => setFormData({ ...formData, guestId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" required value={formData.guestEmail} onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all" />
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
                <input 
                  type="text" 
                  readOnly
                  value={formData.amount ? `$${Number(formData.amount).toLocaleString('es-CL')}` : '$0'} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none bg-gray-50 text-gray-500 font-semibold cursor-not-allowed" 
                  placeholder="$0" 
                />
              </div>
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