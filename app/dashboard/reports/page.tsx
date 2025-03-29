"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  AreaChart,
  PieChart,
  FileBarChart,
  Filter
} from "lucide-react";

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("This Month");

  const reports = [
    {
      id: "REP001",
      name: "Monthly Collection Performance",
      description: "Summary of collection efficiency and utilization metrics",
      lastUpdated: "2025-03-29T09:30:00Z",
      category: "performance",
      format: "PDF"
    },
    {
      id: "REP002",
      name: "Area Utilization Report",
      description: "Breakdown of bin utilization across different areas",
      lastUpdated: "2025-03-28T14:45:00Z",
      category: "utilization",
      format: "Excel"
    },
    {
      id: "REP003",
      name: "Collector Efficiency Analysis",
      description: "Performance metrics for individual collectors",
      lastUpdated: "2025-03-27T11:20:00Z",
      category: "personnel",
      format: "PDF"
    },
    {
      id: "REP004",
      name: "Route Optimization Impact",
      description: "Analysis of service delays before and after route optimization",
      lastUpdated: "2025-03-26T16:15:00Z",
      category: "routes",
      format: "PDF"
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "performance":
        return <BarChart3 className="h-5 w-5 text-blue-600" />;
      case "utilization":
        return <PieChart className="h-5 w-5 text-green-600" />;
      case "personnel":
        return <AreaChart className="h-5 w-5 text-purple-600" />;
      case "routes":
        return <FileBarChart className="h-5 w-5 text-amber-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white">
            <Calendar size={16} className="text-gray-500" />
            <select 
              className="bg-transparent border-none outline-none text-sm"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last 3 Months</option>
              <option>Custom Range</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <BarChart3 size={16} /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Collection Efficiency</span>
            </CardTitle>
            <CardDescription>
              Average efficiency by area for {reportPeriod.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-500">Collection efficiency chart will be displayed here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <span>Bin Utilization</span>
            </CardTitle>
            <CardDescription>
              Distribution of bin fill levels across areas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-500">Bin utilization chart will be displayed here</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            <span>Generated Reports</span>
          </CardTitle>
          <CardDescription>
            Access and download previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Report ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Updated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Format</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{report.id}</td>
                    <td className="py-3 px-4">{report.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(report.category)}
                        <span className="capitalize">{report.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{report.description}</td>
                    <td className="py-3 px-4">{formatDate(report.lastUpdated)}</td>
                    <td className="py-3 px-4">{report.format}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium ml-auto">
                        <Download size={16} /> Download
                      </button>
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