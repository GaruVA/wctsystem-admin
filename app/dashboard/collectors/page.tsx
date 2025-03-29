"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Search, UserPlus, Filter } from "lucide-react";

interface Collector {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedArea: string;
  status: "active" | "inactive" | "on-leave";
}

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([
    {
      id: "COL001",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      assignedArea: "Area-001",
      status: "active",
    },
    {
      id: "COL002",
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "+1 (555) 234-5678",
      assignedArea: "Area-002",
      status: "active",
    },
    {
      id: "COL003",
      name: "Michael Williams",
      email: "michael.williams@example.com",
      phone: "+1 (555) 345-6789",
      assignedArea: "Area-003",
      status: "inactive",
    },
    {
      id: "COL004",
      name: "Emily Brown",
      email: "emily.brown@example.com",
      phone: "+1 (555) 456-7890",
      assignedArea: "Area-001",
      status: "on-leave",
    },
  ]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "on-leave":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Collector Management</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search collectors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <UserPlus size={16} /> Add Collector
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Collectors</span>
          </CardTitle>
          <CardDescription>
            Manage waste collection personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Collector ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Assigned Area</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((collector) => (
                  <tr key={collector.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{collector.id}</td>
                    <td className="py-3 px-4">{collector.name}</td>
                    <td className="py-3 px-4">{collector.email}</td>
                    <td className="py-3 px-4">{collector.phone}</td>
                    <td className="py-3 px-4">{collector.assignedArea}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(collector.status)}`}>
                        {collector.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
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