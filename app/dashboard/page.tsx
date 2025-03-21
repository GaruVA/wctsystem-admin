"use client";

import { useSearchParams } from "next/navigation";
import Dashboard from "./dashboard";
import AreasPage from "./areas";
import CollectorsPage from "./collectors";
import BinsPage from "./bins";
import Sidebar from "../../components/Sidebar";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "dashboard";

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        {tab === "dashboard" && <Dashboard />}
        {tab === "areas" && <AreasPage />}
        {tab === "collectors" && <CollectorsPage />}
        {tab === "bins" && <BinsPage />}
      </div>
    </div>
  );
}
