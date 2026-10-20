import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

export type PropertyType = 'Hostal' | 'Cabaña' | 'Lodge';

export interface Property {
  id: string;
  code: string;
  name: string;
  location: string;
  region: string;
  type: PropertyType;
  totalRooms: number;
  occupiedRooms: number;
  cleaningRooms: number;
  description?: string;
  address?: string;
  maxOccupancy?: number;
  bathrooms?: number;
  pricePerNight?: number;
  available?: boolean;
}

const REGIONS_LIST = ['Todas', 'Región RM', 'Región V', 'Región IX', 'Región X', 'Región II'];
const TYPES_LIST = ['Todos', 'Hostal', 'Cabaña', 'Lodge'];

export default function Catalog() {
  const { isAdmin, isRecepcionista, isHuesped } = useAuth();
  // La ocupación y los datos de housekeeping son información operativa:
  // solo se muestran (y se consultan) a administración y recepción.
  const isStaff = isAdmin || isRecepcionista;

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedRegion, setSelectedRegion] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: '',
    type: 'Hostal' as PropertyType,
    totalRooms: 10,
    occupiedRooms: 0,
    cleaningRooms: 0,
  });

  useEffect(() => {
    const fetchCatalogAndOccupancy = async () => {
      try {
        const [catalogResponse, reservationsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.catalog.list),
          // Para huéspedes no se consultan reservas: el listado solo trae las propias
          // y no sirve para calcular ocupación real.
          isStaff
            ? apiClient.get(API_ENDPOINTS.reservations.list)
            : Promise.resolve({ data: [] }),
        ]);

        const rawUnits = Array.isArray(catalogResponse.data)
          ? catalogResponse.data
          : (catalogResponse.data?.content || []);

        const rawReservations = isStaff
          ? Array.isArray(reservationsResponse.data)
            ? reservationsResponse.data
            : (reservationsResponse.data?.content || [])
          : [];

        const normalizeStatus = (status?: string) =>
          status ? status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() : '';

        const mappedProperties: Property[] = rawUnits.map((unit: any) => {
          const currentUnitId = String(unit.unitId || unit.id);

          const activeOccupants = rawReservations.filter((res: any) => {
            const resUnitId = String(res.unitId || res.alojamientoId || (res.unit && res.unit.id) || '');
            const estado = normalizeStatus(res.status ?? res.estado);
            return resUnitId === currentUnitId && estado === 'EN_ESTADIA';
          });

          return {
            id: currentUnitId,
            code: `U${currentUnitId}`,
            name: unit.name || 'Sin nombre',
            location: unit.city || 'Sin ciudad',
            region: 'Región RM',
            type: unit.type === 'HABITACION' ? 'Hostal' : unit.type === 'SUITE' ? 'Lodge' : 'Cabaña',
            totalRooms: unit.rooms || 1,
            occupiedRooms: activeOccupants.length,
            cleaningRooms: 0,
            description: unit.description || '',
            address: unit.address || '',
            maxOccupancy: Number(unit.maxOccupancy) || 0,
            bathrooms: Number(unit.bathrooms) || 0,
            pricePerNight: Number(unit.pricePerNight) || 0,
            available: unit.availability !== false,
          };
        });

        setProperties(mappedProperties);
      } catch (error) {
        console.error('Error al cargar el catálogo y cruzar ocupación:', error);
      }
    };

    fetchCatalogAndOccupancy();
  }, [isStaff]);

  const filteredProperties = properties.filter((prop) => {
    const matchesType = selectedType === 'Todos' || prop.type === selectedType;
    const matchesRegion = selectedRegion === 'Todas' || prop.region === selectedRegion;
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (prop.name || '').toLowerCase().includes(search) ||
      (prop.location || '').toLowerCase().includes(search) ||
      (isStaff && (prop.code || '').toLowerCase().includes(search));
    return matchesType && matchesRegion && matchesSearch;
  });

  const totalPropertiesCount = properties.length;
  const totalRoomsCount = properties.reduce((acc, curr) => acc + curr.totalRooms, 0);
  const totalOccupiedCount = properties.reduce((acc, curr) => acc + curr.occupiedRooms, 0);
  const totalAvailableCount = properties.reduce(
    (acc, curr) => acc + Math.max(curr.totalRooms - curr.occupiedRooms - curr.cleaningRooms, 0),
    0
  );

  const handleOpenModal = (propertyToEdit?: Property) => {
    if (propertyToEdit) {
      setEditingPropertyId(propertyToEdit.id);
      setFormData({
        name: propertyToEdit.name,
        location: propertyToEdit.location,
        region: propertyToEdit.region,
        type: propertyToEdit.type,
        totalRooms: propertyToEdit.totalRooms,
        occupiedRooms: propertyToEdit.occupiedRooms,
        cleaningRooms: propertyToEdit.cleaningRooms,
      });
    } else {
      setEditingPropertyId(null);
      setFormData({
        name: '',
        location: '',
        region: '',
        type: 'Hostal',
        totalRooms: 10,
        occupiedRooms: 0,
        cleaningRooms: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim() || formData.totalRooms <= 0) {
      alert('Por favor ingresa datos válidos para la propiedad.');
      return;
    }

    if (editingPropertyId) {
      setProperties((prev) =>
        prev.map((prop) =>
          prop.id === editingPropertyId
            ? {
                ...prop,
                name: formData.name,
                location: formData.location,
                region: formData.region,
                type: formData.type,
                totalRooms: Number(formData.totalRooms),
                occupiedRooms: Number(formData.occupiedRooms) || 0,
                cleaningRooms: Number(formData.cleaningRooms) || 0,
              }
            : prop
        )
      );
    } else {
      const nextIndex = properties.length + 1;
      const newCode = `P${nextIndex < 10 ? '0' + nextIndex : nextIndex}`;

      const newProperty: Property = {
        id: Date.now().toString(),
        code: newCode,
        name: formData.name,
        location: formData.location,
        region: formData.region,
        type: formData.type,
        totalRooms: Number(formData.totalRooms),
        occupiedRooms: Number(formData.occupiedRooms) || 0,
        cleaningRooms: Number(formData.cleaningRooms) || 0,
      };

      setProperties([newProperty, ...properties]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta propiedad del catálogo?')) {
      setProperties((prev) => prev.filter((prop) => prop.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barra lateral */}
        <aside className="w-full md:w-64 bg-white p-6 flex flex-col justify-between shrink-0 border-r border-gray-200">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
                Tipo de unidad
              </span>
              <div className="flex flex-col space-y-1">
                {TYPES_LIST.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                      selectedType === type
                        ? 'bg-[#0070F3] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {isStaff && (
              <>
                <hr className="border-gray-200" />

                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Ubicación / Región
                  </span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#0070F3]"
                  >
                    {REGIONS_LIST.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
                    Consolidado Red
                  </span>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        Propiedades
                      </span>
                      <span className="font-bold text-gray-900">{totalPropertiesCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#0070F3]" />
                        Habitaciones
                      </span>
                      <span className="font-bold text-gray-900">{totalRoomsCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#0070F3]">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#0070F3]" />
                        Ocupadas
                      </span>
                      <span className="font-bold">{totalOccupiedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Disponibles
                      </span>
                      <span className="font-bold">{totalAvailableCount}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isHuesped && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">Reserva en pocos pasos</p>
                <p className="mt-1 text-[11px] leading-relaxed text-blue-700">
                  Elige una unidad, revisa el precio por noche y presiona “Reservar unidad”.
                  Las fechas se completan en el siguiente paso.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Panel Central */}
        <main className="flex-1 p-6 md:p-8 space-y-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {isHuesped ? 'Explora nuestras unidades' : 'Catálogo de Unidades y Propiedades'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isHuesped
                  ? 'Encuentra el alojamiento ideal y reserva directamente.'
                  : 'Visualización de disponibilidad y estado en tiempo real.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={isHuesped ? 'Buscar por nombre o ciudad...' : 'Buscar por nombre, ciudad o código...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#0070F3] focus:border-[#0070F3]"
                />
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="bg-[#0070F3] hover:bg-[#005BD1] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Agregar propiedad</span>
                </button>
              )}
            </div>
          </div>

          {/* Listado de habitaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => {
              const occupancyRate =
                prop.totalRooms > 0 ? Math.round((prop.occupiedRooms / prop.totalRooms) * 100) : 0;
              const isFull = occupancyRate >= 100;
              const availableRooms = Math.max(prop.totalRooms - prop.occupiedRooms - prop.cleaningRooms, 0);

              return (
                <article
                  key={prop.id}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-[#0070F3]/40 transition-all duration-200 flex flex-col"
                >
                  {/* Encabezado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 border border-gray-200 rounded px-2 py-0.5 tracking-wider uppercase">
                          {prop.type}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-gray-900 truncate">{prop.name}</h2>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {isHuesped ? prop.location : `${prop.location} · ${prop.region}`}
                      </p>
                      {isHuesped && prop.address && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{prop.address}</p>
                      )}
                    </div>
                    {isStaff && (
                      <span className="shrink-0 text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 mt-1">
                        {prop.code}
                      </span>
                    )}
                  </div>

                  {isHuesped && (
                    <>
                      {prop.description && (
                        <p className="mt-3 text-xs leading-relaxed text-gray-600 line-clamp-2">
                          {prop.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="text-[11px] leading-relaxed text-gray-500">
                          {prop.maxOccupancy ? <span>Hasta {prop.maxOccupancy} personas</span> : null}
                          {prop.maxOccupancy && prop.bathrooms ? (
                            <span className="mx-1 text-gray-300">·</span>
                          ) : null}
                          {prop.bathrooms ? (
                            <span>{prop.bathrooms} {prop.bathrooms === 1 ? 'baño' : 'baños'}</span>
                          ) : null}
                        </div>
                        {prop.pricePerNight ? (
                          <div className="shrink-0 text-right">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                              Por noche
                            </div>
                            <div className="text-sm font-bold text-[#0070F3]">
                              ${Number(prop.pricePerNight).toLocaleString('es-CL')}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}

                  {isStaff && (
                    <>
                      {/* Estadísticas rápidas */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2 text-center">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total</div>
                          <div className="text-sm font-bold text-gray-900">{prop.totalRooms}</div>
                        </div>
                        <div className="rounded-lg bg-[#0070F3]/5 border border-[#0070F3]/15 px-2.5 py-2 text-center">
                          <div className="text-[10px] font-semibold text-[#0070F3] uppercase tracking-wide">Ocup.</div>
                          <div className="text-sm font-bold text-[#0070F3]">{prop.occupiedRooms}</div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2 text-center">
                          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Disp.</div>
                          <div className="text-sm font-bold text-emerald-600">{availableRooms}</div>
                        </div>
                      </div>

                      {/* Barra de ocupación */}
                      <div className="mt-4">
                        <div className="flex justify-between items-baseline text-xs font-semibold mb-1.5">
                          <span className="text-gray-600">Ocupación</span>
                          <span className={`font-bold ${isFull ? 'text-red-600' : 'text-gray-900'}`}>
                            {occupancyRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isFull ? 'bg-red-500' : 'bg-[#0070F3]'
                            }`}
                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                          />
                        </div>
                        {prop.cleaningRooms > 0 && (
                          <div className="mt-1.5 text-[11px] text-[#0070F3] font-medium flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                            </svg>
                            ↻ {prop.cleaningRooms} en limpieza
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Acciones */}
                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    {isHuesped && (
                      prop.available === false ? (
                        <span className="w-full text-center bg-gray-100 text-gray-500 text-xs font-semibold py-2 rounded-lg">
                          No disponible
                        </span>
                      ) : (
                        <Link
                          to={`/reservations?unitId=${prop.id}`}
                          className="w-full text-center bg-[#0070F3] hover:bg-[#005BD1] text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Reservar unidad
                        </Link>
                      )
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(prop)}
                          className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProperties.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                {isHuesped
                  ? 'No encontramos unidades que coincidan con tu búsqueda. Prueba con otro tipo o ciudad.'
                  : 'No se encontraron propiedades que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingPropertyId ? 'Editar Propiedad' : 'Agregar Nueva Propiedad'}
            </h2>
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cabaña Bosque Nativo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as PropertyType })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0070F3]"
                  >
                    <option value="Hostal">Hostal</option>
                    <option value="Cabaña">Cabaña</option>
                    <option value="Lodge">Lodge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Habitaciones</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalRooms}
                    onChange={(e) =>
                      setFormData({ ...formData, totalRooms: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0070F3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Comuna / Ciudad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pucón"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Región</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0070F3]"
                >
                  <option value="Región RM">Región RM</option>
                  <option value="Región V">Región V</option>
                  <option value="Región IX">Región IX</option>
                  <option value="Región X">Región X</option>
                  <option value="Región II">Región II</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0070F3] hover:bg-[#005BD1] rounded-lg shadow-sm transition-colors"
                >
                  {editingPropertyId ? 'Guardar Cambios' : 'Guardar Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}