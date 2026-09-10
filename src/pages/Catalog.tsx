import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

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
}

const INITIAL_PROPERTIES: Property[] = [
  { id: '1', code: 'P01', name: 'El Roble', location: 'Santiago Centro', region: 'Región RM', type: 'Hostal', totalRooms: 18, occupiedRooms: 14, cleaningRooms: 3 },
  { id: '2', code: 'P02', name: 'Cerro Azul', location: 'Valparaíso', region: 'Región V', type: 'Hostal', totalRooms: 12, occupiedRooms: 10, cleaningRooms: 2 },
  { id: '3', code: 'P03', name: 'Lastarria', location: 'Santiago', region: 'Región RM', type: 'Hostal', totalRooms: 8, occupiedRooms: 6, cleaningRooms: 1 },
  { id: '4', code: 'P04', name: 'El Arrayán', location: 'Santiago', region: 'Región RM', type: 'Hostal', totalRooms: 10, occupiedRooms: 7, cleaningRooms: 0 },
  { id: '5', code: 'P05', name: 'Los Boldos', location: 'Pucón', region: 'Región IX', type: 'Cabaña', totalRooms: 6, occupiedRooms: 6, cleaningRooms: 1 },
  { id: '6', code: 'P06', name: 'Lago Llanquihue', location: 'Puerto Varas', region: 'Región X', type: 'Cabaña', totalRooms: 8, occupiedRooms: 5, cleaningRooms: 2 },
];

export default function Catalog() {
  const { isAdmin, isHuesped } = useUserRole();
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: 'Región RM',
    type: 'Hostal' as PropertyType,
    totalRooms: 10,
    occupiedRooms: 0,
    cleaningRooms: 0,
  });

  const filteredProperties = properties.filter((prop) => {
    if (selectedType === 'Todos') return true;
    return prop.type === selectedType;
  });

  const totalPropertiesCount = properties.length;
  const totalRoomsCount = properties.reduce((acc, curr) => acc + curr.totalRooms, 0);
  const totalOccupiedCount = properties.reduce((acc, curr) => acc + curr.occupiedRooms, 0);

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim() || formData.totalRooms <= 0) {
      alert('Por favor ingresa datos válidos para la propiedad.');
      return;
    }

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
    setIsModalOpen(false);
    setFormData({
      name: '',
      location: '',
      region: 'Región RM',
      type: 'Hostal',
      totalRooms: 10,
      occupiedRooms: 0,
      cleaningRooms: 0,
    });
  };

  const typesList = ['Todos', 'Hostal', 'Cabaña', 'Lodge'];

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col font-sans">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barra lateral */}
        <aside className="w-full md:w-56 bg-[#F4EFEA]/80 p-6 flex flex-col justify-between shrink-0 border-r border-[#E5DDD5]">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
                Tipo de unidad
              </span>
              <div className="flex flex-col space-y-1">
                {typesList.map((type) => (
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
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
                Consolidado Red
              </span>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-700">
                  <span>Propiedades</span>
                  <span className="font-bold text-gray-900">{totalPropertiesCount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Habitaciones</span>
                  <span className="font-bold text-gray-900">{totalRoomsCount}</span>
                </div>
                <div className="flex items-center justify-between text-[#CB6D51] font-semibold">
                  <span>Ocupadas</span>
                  <span className="font-bold">{totalOccupiedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Panel Central */}
        <main className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Catálogo de Unidades y Propiedades
            </h1>
            
            {/* Solo el Administrador puede crear nuevas propiedades */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="bg-[#CB6D51] hover:bg-[#b85e44] text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>+</span>
                <span>Agregar propiedad</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => {
              const occupancyRate =
                prop.totalRooms > 0
                  ? Math.round((prop.occupiedRooms / prop.totalRooms) * 100)
                  : 0;
              const isFull = occupancyRate >= 100;

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border border-gray-200/90 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{prop.name}</h2>
                        <p className="text-xs text-gray-500">{prop.location}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 border border-gray-200 rounded px-2 py-0.5 tracking-wider uppercase">
                        {prop.type}
                      </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs font-semibold">
                        <span className="text-gray-600">Ocupación</span>
                        <span className={`font-bold ${isFull ? 'text-[#CB6D51]' : 'text-gray-900'}`}>
                          {occupancyRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isFull ? 'bg-[#CB6D51]' : 'bg-[#1A423B]'
                          }`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2.5">
                      <span>{prop.occupiedRooms} / {prop.totalRooms} hab.</span>
                      {prop.cleaningRooms > 0 && (
                        <span className="text-[#CB6D51] font-medium flex items-center gap-1">
                          ↻ {prop.cleaningRooms} en limpieza
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acción según el rol */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                    {isHuesped && !isFull && (
                      <Link
                        to={`/reservations?property=${prop.code}`}
                        className="w-full text-center bg-[#1A423B] hover:bg-[#13332d] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                      >
                        Reservar Unidad
                      </Link>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
                      <span>CÓD: {prop.code}</span>
                      <span className="font-sans">{prop.region}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProperties.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
              No se encontraron propiedades bajo la categoría "{selectedType}".
            </div>
          )}
        </main>
      </div>

      {/* Modal restringido al Admin */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Agregar Nueva Propiedad</h2>
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cabaña Bosque Nativo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Región</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A423B]"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-[#CB6D51] hover:bg-[#b85e44] rounded-lg shadow-xs transition-colors"
                >
                  Guardar Propiedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}