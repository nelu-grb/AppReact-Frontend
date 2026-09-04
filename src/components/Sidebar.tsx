import type { ReactNode } from 'react';

// 1. Contenedor Principal del Sidebar
interface SidebarProps {
  children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-56 bg-[#F3EFE9] border-r border-gray-200 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
      {children}
    </aside>
  );
}

// 2. Subcomponente reutilizable para los menús de filtros (Estado, Canal, Tipo, etc.)
interface FilterGroupProps {
  title: string;
  items: string[];
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function SidebarFilterGroup({ title, items, activeItem, onItemClick }: FilterGroupProps) {
  return (
    <div>
      <h3 className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item === activeItem;
          return (
            <li 
              key={item}
              onClick={() => onItemClick(item)}
              className={`px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                isActive 
                  ? 'bg-[#CB6D51] text-white font-medium shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// 3. Subcomponente para separadores (la línea que divide secciones)
export function SidebarDivider() {
  return <div className="border-t border-gray-200 pt-6"></div>;
}