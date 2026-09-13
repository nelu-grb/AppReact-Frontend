import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { createUnit, deleteUnit, getUnits, updateUnit } from '../services/catalogService';
import type { Unit, UnitType } from '../services/catalogService';
import { errorHandler } from '../utils/errorHandler';

const TYPES_LIST = ['Todos', 'HABITACION', 'SUITE', 'APARTAMENTO', 'CABANA'] as const;

const emptyForm = {
  name: '',
  description: '',
  address: '',
  city: 'Santiago',
  type: 'HABITACION' as UnitType,
  rooms: 1,
  bathrooms: 1,
  pricePerNight: 0,
  maxOccupancy: 2,
  availability: true,
};

export default function Catalog() {
  const { isAdmin, isHuesped } = useUserRole();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [selectedCity, setSelectedCity] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const cityOptions = ['Todas', ...Array.from(new Set(units.map((unit) => unit.city))).sort()];

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUnits();
      setUnits(data);
    } catch (err) {
      setError(errorHandler(err));
      console.error('Error fetching units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const filteredUnits = units.filter((unit) => {
    const matchesType = selectedType === 'Todos' || unit.type === selectedType;
    const matchesCity = selectedCity === 'Todas' || unit.city === selectedCity;
    const matchesSearch =
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesCity && matchesSearch;
  });

  const totalUnitsCount = units.length;
  const totalRoomsCount = units.reduce((acc, curr) => acc + curr.rooms, 0);
  const availableUnitsCount = units.filter((unit) => unit.availability).length;

  const handleOpenModal = (unitToEdit?: Unit) => {
    if (unitToEdit) {
      setEditingUnitId(unitToEdit.unitId);
      setFormData({
        name: unitToEdit.name,
        description: unitToEdit.description ?? '',
        address: unitToEdit.address,
        city: unitToEdit.city,
        type: unitToEdit.type,
        rooms: unitToEdit.rooms,
        bathrooms: unitToEdit.bathrooms,
        pricePerNight: Number(unitToEdit.pricePerNight),
        maxOccupancy: unitToEdit.maxOccupancy,
        availability: unitToEdit.availability,
      });
    } else {
      setEditingUnitId(null);
      setFormData(emptyForm);
    }

    setIsModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim() || formData.rooms <= 0) {
      alert('Completa nombre, dirección y habitaciones para guardar la unidad.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        type: formData.type,
        availability: formData.availability,
        rooms: Number(formData.rooms),
        bathrooms: Number(formData.bathrooms),
        pricePerNight: Number(formData.pricePerNight),
        maxOccupancy: Number(formData.maxOccupancy),
      };

      if (editingUnitId !== null) {
        const updated = await updateUnit(editingUnitId, payload);
        setUnits((prev) => prev.map((unit) => (unit.unitId === editingUnitId ? updated : unit)));
      } else {
        const created = await createUnit(payload);
        setUnits((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
      setEditingUnitId(null);
      setFormData(emptyForm);
    } catch (err) {
      alert(errorHandler(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad del catálogo?')) {
      return;
    }

    try {
      await deleteUnit(unitId);
      setUnits((prev) => prev.filter((unit) => unit.unitId !== unitId));
    } catch (err) {
      alert(errorHandler(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-60 bg-[#F4EFEA]/80 p-6 flex flex-col justify-between shrink-0 border-r border-[#E5DDD5]">
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
                        ? 'bg-[#CB6D51] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-[#EAE2D9]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[#E2D8CE]" />

            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Ciudad
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white outline-none focus:ring-2 focus:ring-[#1A423B]"
              >
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <hr className="border-[#E2D8CE]" />

            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
                Consolidado Red
              </span>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Unidades</span>
                  <span className="font-bold text-gray-900">{totalUnitsCount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Habitaciones</span>
                  <span className="font-bold text-gray-900">{totalRoomsCount}</span>
                </div>
                <div className="flex items-center justify-between text-[#CB6D51] font-semibold">
                  <span>Disponibles</span>
                  <span className="font-bold">{availableUnitsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Catálogo de Unidades
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Información proveniente del microservicio de catálogo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre, ciudad o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#1A423B] w-full sm:w-64"
              />

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="bg-[#CB6D51] hover:bg-[#b85e44] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Agregar unidad</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              Cargando unidades del catálogo...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.unitId}
                  className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{unit.name}</h2>
                        <p className="text-xs text-gray-500">{unit.city}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 border border-gray-200 rounded px-2 py-0.5 tracking-wider uppercase">
                        {unit.type}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-gray-600">{unit.address}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {unit.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="mt-4 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Disponibilidad</span>
                        <span className={unit.availability ? 'font-bold text-[#1A423B]' : 'font-bold text-[#CB6D51]'}>
                          {unit.availability ? 'Disponible' : 'No disponible'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Habitaciones</span>
                        <span className="font-semibold text-gray-900">{unit.rooms}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Baños</span>
                        <span className="font-semibold text-gray-900">{unit.bathrooms}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Huéspedes</span>
                        <span className="font-semibold text-gray-900">{unit.maxOccupancy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Precio</span>
                        <span className="font-bold text-[#1A423B]">
                          ${Number(unit.pricePerNight).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                    {isHuesped && unit.availability && (
                      <Link
                        to={`/reservations?unitId=${unit.unitId}`}
                        className="w-full text-center bg-[#1A423B] hover:bg-[#13332d] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        Reservar Unidad
                      </Link>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(unit)}
                          className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(unit.unitId)}
                          className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono mt-1">
                      <span>ID: {unit.unitId}</span>
                      <span className="font-sans">{unit.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredUnits.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              No se encontraron unidades que coincidan con los filtros seleccionados.
            </div>
          )}
        </main>
      </div>

      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingUnitId ? 'Editar unidad' : 'Agregar nueva unidad'}
            </h2>
            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as UnitType })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  >
                    <option value="HABITACION">HABITACION</option>
                    <option value="SUITE">SUITE</option>
                    <option value="APARTAMENTO">APARTAMENTO</option>
                    <option value="CABANA">CABANA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Habitaciones</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: Number(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Baños</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio noche</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Máx. ocupantes</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxOccupancy}
                    onChange={(e) => setFormData({ ...formData, maxOccupancy: Number(e.target.value) || 1 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-700">Disponible</span>
                  <input
                    type="checkbox"
                    checked={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#CB6D51] hover:bg-[#b85e44] rounded-lg shadow-xs transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Guardando...' : editingUnitId ? 'Guardar cambios' : 'Guardar unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}