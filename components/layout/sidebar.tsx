"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Route,
  Users,
  BarChart3,
  LogOut,
  Trash2,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = pathname?.split('/').pop() || 'dashboard';

  const isActivePath = (path: string) => {
    return currentPath === path;
  };

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-950 text-white fixed top-0 left-0 h-screen p-4 shadow-xl flex flex-col">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Trash2 size={28} className="text-blue-400" />
        <h1 className="text-xl font-semibold tracking-tight">WCT System</h1>
      </div>

      <nav className="flex-1">
        <ul>
          <li className="mb-2">
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 hover:bg-blue-800 ${
                isActivePath('dashboard') ? 'bg-blue-800 text-white' : 'text-gray-300'
              }`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/dashboard/schedule" 
              className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 hover:bg-blue-800 ${
                isActivePath('schedule') ? 'bg-blue-800 text-white' : 'text-gray-300'
              }`}
            >
              <Route size={20} />
              <span>Schedule & Routes</span>
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/dashboard/collectors" 
              className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 hover:bg-blue-800 ${
                isActivePath('collectors') ? 'bg-blue-800 text-white' : 'text-gray-300'
              }`}
            >
              <Users size={20} />
              <span>Collector Management</span>
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/dashboard/reports" 
              className={`flex items-center gap-3 p-3 rounded-md transition-all duration-200 hover:bg-blue-800 ${
                isActivePath('reports') ? 'bg-blue-800 text-white' : 'text-gray-300'
              }`}
            >
              <BarChart3 size={20} />
              <span>Reports</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto border-t border-blue-800 pt-4">
        <Link 
          href="/auth/login" 
          className="flex items-center gap-3 p-3 rounded-md text-gray-300 hover:bg-blue-800 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}