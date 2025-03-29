"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Route, Calendar, Clock, Truck, Filter } from "lucide-react";

interface RouteSchedule {
  id: string;
  name: string;
  areaId: string;
  collectorId: string;
  collectorName: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  bins: number;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<RouteSchedule[]>([
    {
      id: "SCH001",
      name: "Morning Route A",
      areaId: "Area-001",
      collectorId: "COL001",
      collectorName: "John Smith",
      startTime: "2025-03-29T08:00:00Z",
      endTime: "2025-03-29T12:00:00Z",
      status: "scheduled",
      bins: 34
    },
    {
      id: "SCH002",
      name: "Afternoon Route B",
      areaId: "Area-002",
      collectorId: "COL002",
      collectorName: "Sarah Johnson",
      startTime: "2025-03-29T13:00:00Z",
      endTime: "2025-03-29T17:00:00Z",
      status: "in-progress",
      bins: 28
    },
    {
      id: "SCH003",
      name: "Evening Route C",
      areaId: "Area-003",
      collectorId: "COL003",
      collectorName: "Michael Williams",
      startTime: "2025-03-29T18:00:00Z",
      endTime: "2025-03-29T22:00:00Z",
      status: "scheduled",
      bins: 42
    },
    {
      id: "SCH004",
      name: "Morning Route D",
      areaId: "Area-001",
      collectorId: "COL004",
      collectorName: "Emily Brown",
      startTime: "2025-03-28T08:00:00Z",
      endTime: "2025-03-28T12:00:00Z",
      status: "completed",
      bins: 34
    },
  ]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule & Routes</h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm">March 29, 2025</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Route size={16} /> Create Route
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            <span>Collection Routes</span>
          </CardTitle>
          <CardDescription>
            Schedule and manage waste collection routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Route ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Area</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Collector</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Start Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">End Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bins</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{schedule.id}</td>
                    <td className="py-3 px-4">{schedule.name}</td>
                    <td className="py-3 px-4">{schedule.areaId}</td>
                    <td className="py-3 px-4">{schedule.collectorName}</td>
                    <td className="py-3 px-4">{formatDateTime(schedule.startTime)}</td>
                    <td className="py-3 px-4">{formatDateTime(schedule.endTime)}</td>
                    <td className="py-3 px-4">{schedule.bins}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-medium mr-2">View</button>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}