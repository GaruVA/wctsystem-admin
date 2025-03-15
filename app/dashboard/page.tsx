"use client";

import { useSearchParams } from "next/navigation";
import StatsPage from "./stats";
import MapPage from "./map";
import NotificationsPage from "./notifications";
import DriverPage from "./driver";
import Sidebar from "../../components/Sidebar";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") || "stats";

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        {tab === "stats" && <StatsPage />}
        {tab === "map" && <MapPage />}
        {tab === "notifications" && <NotificationsPage />}
        {tab === "driver" && <DriverPage />}
      </div>
    </div>
  );
}
