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
      <Sidebar className="hidden lg:flex" />
      <main className={cn("flex-1 overflow-y-auto", className)}>
        {children}
      </main>
    </div>
  );
}