import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function Reservations() {
  // Datos mockeados basados en tu imagen
  const reservationsData = [
    { id: 'R-2024-0891', guest: 'Valentina Morales', email: 'v.morales@gmail.com', property: 'Patagonia Sur', room: 'Suite 3', in: '15-mar', out: '18-mar', nights: 3, status: 'Check-in', channel: 'Web', total: '$187.000' },
    { id: 'R-2024-0892', guest: 'Tomás Aravena', email: 'taravena@outlook.com', property: 'Torres del Paine', room: 'Hab. 7', in: '15-mar', out: '20-mar', nights: 5, status: 'Check-in', channel: 'Web', total: '$310.000' },
    { id: 'R-2024-0893', guest: 'Camila Reyes', email: 'camila.r@icloud.com', property: 'El Roble', room: 'Dorm 4A', in: '14-mar', out: '16-mar', nights: 2, status: 'Check-out', channel: 'Instagram', total: '$42.000' },
    { id: 'R-2024-0894', guest: 'Nicolás Fuentes', email: 'n.fuentes@empresa.cl', property: 'Atacama Lodge', room: 'Hab. 2', in: '16-mar', out: '19-mar', nights: 3, status: 'Confirmada', channel: 'Directo', total: '$225.000' },
    { id: 'R-2024-0895', guest: 'Isabella Soto', email: 'isabella.soto@gmail.com', property: 'Los Boldos', room: 'Cabaña A', in: '17-mar', out: '22-mar', nights: 5, status: 'Confirmada', channel: 'WhatsApp', total: '$390.000' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F6] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-56 bg-[#F3EFE9] border-r border-gray-200 p-6 flex flex-col gap-8">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Estado</h3>
            <ul className="space-y-1">
              <li className="bg-[#CB6D51] text-white px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer">Todas</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Pendiente</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Confirmada</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Check-in</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Check-out</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Cancelada</li>
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Canal</h3>
            <ul className="space-y-1">
              <li className="bg-[#CB6D51] text-white px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer">Todos</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Web</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Instagram</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">WhatsApp</li>
              <li className="text-gray-700 px-3 py-1.5 hover:bg-gray-200 rounded-md text-sm cursor-pointer">Directo</li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reservas</h1>
              <p className="text-sm text-gray-500">15 resultados</p>
            </div>
            <div className="flex gap-4">
              <input type="text" placeholder="Buscar huésped o ID..." className="border border-gray-300 rounded-md px-4 py-2 text-sm w-64 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#CB6D51]" />
              <button className="bg-[#CB6D51] text-white px-4 py-2 rounded-md font-medium text-sm shadow-sm hover:bg-[#b85b40] transition-colors">
                + Nueva reserva
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#F8F9FA] text-[11px] text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Huésped</th>
                  <th className="px-6 py-4 font-semibold">Propiedad</th>
                  <th className="px-6 py-4 font-semibold">Habitación</th>
                  <th className="px-6 py-4 font-semibold">Entrada</th>
                  <th className="px-6 py-4 font-semibold">Salida</th>
                  <th className="px-6 py-4 font-semibold">N</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Canal</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {reservationsData.map((res, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{res.id}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{res.guest}</p>
                      <p className="text-xs text-gray-400">{res.email}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{res.property}</td>
                    <td className="px-6 py-3 text-gray-600">{res.room}</td>
                    <td className="px-6 py-3 text-gray-600">{res.in}</td>
                    <td className="px-6 py-3 text-gray-600">{res.out}</td>
                    <td className="px-6 py-3 text-gray-600">{res.nights}</td>
                    <td className="px-6 py-3"><StatusBadge status={res.status} /></td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{res.channel}</td>
                    <td className="px-6 py-3 font-semibold text-gray-800">{res.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}