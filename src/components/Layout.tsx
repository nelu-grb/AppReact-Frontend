import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0F2922] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

///