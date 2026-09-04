import Navbar from '../components/Navbar';

export default function Catalog() {
  const catalogData = [
    { name: 'El Roble', type: 'Hostal', location: 'Santiago Centro', occPercent: 78, occHab: '14 / 18 hab.', cleaning: 3, id: 'P01', region: 'Región RM' },
    { name: 'Cerro Azul', type: 'Hostal', location: 'Valparaíso', occPercent: 83, occHab: '10 / 12 hab.', cleaning: 2, id: 'P02', region: 'Región V' },
    { name: 'Lastarria', type: 'Hostal', location: 'Santiago', occPercent: 75, occHab: '6 / 8 hab.', cleaning: 1, id: 'P03', region: 'Región RM' },
    { name: 'El Arrayán', type: 'Hostal', location: 'Santiago', occPercent: 70, occHab: '7 / 10 hab.', cleaning: 0, id: 'P04', region: 'Región RM' },
    { name: 'Los Boldos', type: 'Cabaña', location: 'Pucón', occPercent: 100, occHab: '6 / 6 hab.', cleaning: 1, id: 'P05', region: 'Región IX', isFull: true },
    { name: 'Lago Llanquihue', type: 'Cabaña', location: 'Puerto Varas', occPercent: 63, occHab: '5 / 8 hab.', cleaning: 2, id: 'P06', region: 'Región X' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Catálogo */}
        <aside className="w-56 bg-[#F3EFE9] border-r border-gray-200 p-6 flex flex-col gap-8">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Tipo</h3>
            <ul className="space-y-1">
              <li className="bg-[#CB6D51] text-white px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer">Todos</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Hostal</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Cabaña</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Lodge</li>
            </ul>
          </div>
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-[10px] font-bold text-gray-400 mb-4 tracking-widest uppercase">Red Total</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Propiedades</span><span className="font-bold text-gray-800">28</span></div>
              <div className="flex justify-between text-gray-600"><span>Habitaciones</span><span className="font-bold text-gray-800">174</span></div>
              <div className="flex justify-between text-[#CB6D51] font-medium"><span>Ocupadas</span><span>134</span></div>
            </div>
          </div>
        </aside>

        {/* Main Content (Grid) */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Catálogo de propiedades</h1>
            <button className="bg-[#CB6D51] text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm hover:bg-[#b85b40] transition-colors">
              + Agregar propiedad
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogData.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.location}</p>
                  </div>
                  <span className="border border-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded uppercase font-semibold">
                    {item.type}
                  </span>
                </div>
                
                <div className="mt-6 mb-1 flex justify-between text-xs font-semibold">
                  <span className="text-gray-500">Ocupación</span>
                  <span className={item.isFull ? 'text-[#CB6D51]' : 'text-gray-800'}>{item.occPercent}%</span>
                </div>
                
                {/* Barra de progreso */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full ${item.isFull ? 'bg-[#CB6D51]' : 'bg-[#1A423B]'}`} style={{ width: `${item.occPercent}%` }}></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mb-6">
                  <span>{item.occHab}</span>
                  {item.cleaning > 0 && <span className="text-[#CB6D51] flex items-center gap-1">↻ {item.cleaning} limpieza</span>}
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono pt-4 border-t border-gray-100">
                  <span>{item.id}</span>
                  <span>{item.region}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}