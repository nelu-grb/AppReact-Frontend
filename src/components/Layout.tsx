import type { ReactNode } from 'react';
import Navbar from './Navbar'; // Tu barra verde oscuro

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F6]"> {/* Color de fondo general gris claro */}
      <Navbar />
      <main className="flex h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}