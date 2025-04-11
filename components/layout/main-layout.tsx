"use client";

import { ReactNode } from "react";
import Sidebar from "./sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-20 hidden lg:block">
        <Sidebar className="h-screen" />
      </div>
      <main className={cn("flex-1 lg:pl-64 overflow-y-auto", className)}>
        {children}
      </main>
    </div>
  );
}