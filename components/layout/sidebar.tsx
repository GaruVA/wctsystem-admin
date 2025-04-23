"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  BarChart3, 
  LayoutDashboard, 
  Route,
  CalendarClock, 
  Users, 
  Settings, 
  LogOut, 
  Trash2,
  Map
} from "lucide-react"
import { getSettings } from "@/lib/api/settings"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [systemName, setSystemName] = useState("WCT System")

  const routes = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Areas",
      path: "/dashboard/areas",
      icon: Map,
    },
    {
      name: "Bins",
      path: "/dashboard/bins",
      icon: Trash2,
    },
    {
      name: "Schedules",
      path: "/dashboard/schedules",
      icon: CalendarClock,
    },
    {
      name: "Collectors",
      path: "/dashboard/collectors",
      icon: Users,
    },
    {
      name: "Analytics",
      path: "/dashboard/reports",
      icon: BarChart3,
    },
    {
      name: "Settings",
      path: "/dashboard/settings",
      icon: Settings,
    },
  ]
  
  // Fetch system name on mount
  useEffect(() => {
    const fetchSystemName = async () => {
      try {
        const settings = await getSettings();
        if (settings && settings.systemName) {
          setSystemName(settings.systemName);
        }
      } catch (error) {
        console.error("Error fetching system name:", error);
      }
    };
    
    fetchSystemName();
    
    // Listen for system name changes
    const handleSystemNameChange = (event: CustomEvent<string>) => {
      setSystemName(event.detail);
    };
    
    window.addEventListener('system-name-changed', handleSystemNameChange as EventListener);
    
    // Clean up listener
    return () => {
      window.removeEventListener('system-name-changed', handleSystemNameChange as EventListener);
    };
  }, []);

  return (
    <div className={cn("flex w-64 flex-col bg-background border-r h-full", className)}>
      {/* Logo/Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Trash2 className="h-5 w-5 text-primary" />
        <span className="font-semibold truncate">{systemName}</span>
      </div>
      
      {/* Navigation Links - scrollable area */}
      <div className="flex-1 overflow-auto py-2">
        <div className="flex flex-col gap-1 p-2">
          {routes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.path || (pathname?.includes(route.path) && route.path !== "/dashboard")
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-muted hover:text-foreground",
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Logout - fixed at bottom */}
      <div className="mt-auto border-t p-3 bg-background">
        <Link
          href="/login"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </div>
  )
}