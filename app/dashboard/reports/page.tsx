"use client";

import { useState, useEffect } from "react";
import axios from "axios";
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
  Filter,
  RefreshCcw
} from "lucide-react";

interface AnalyticsData {
  [areaId: string]: {
    utilization: number;
    collectionEfficiency: number;
    serviceDelay: number;
    bins: number;
  };
}

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your actual backend URL
});

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("This Month");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get("/analytics/analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // Replace with your actual token
        },
      });
      setAnalytics(response.data as AnalyticsData);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch analytics data");
      
      // Mock data for development
      setAnalytics({
        "Area-001": { utilization: 78, collectionEfficiency: 92, serviceDelay: 12, bins: 34 },
        "Area-002": { utilization: 65, collectionEfficiency: 87, serviceDelay: 18, bins: 28 },
        "Area-003": { utilization: 83, collectionEfficiency: 95, serviceDelay: 8, bins: 42 }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number, isDelay = false) => {
    if (isDelay) {
      return value < 10 ? 'text-green-500' : value < 20 ? 'text-amber-500' : 'text-red-500';
    }
    return value > 80 ? 'text-green-500' : value > 60 ? 'text-amber-500' : 'text-red-500';
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AreaChart className="h-5 w-5" />
            <span>Area Performance</span>
          </CardTitle>
          <CardDescription>
            Performance metrics for each area
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {analytics && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Area</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Utilization</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Collection Efficiency</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Service Delay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Bins</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics).map(([areaId, data]) => (
                    <tr key={areaId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{areaId}</td>
                      <td className={`py-3 px-4 ${getStatusColor(data.utilization)}`}>{data.utilization}%</td>
                      <td className={`py-3 px-4 ${getStatusColor(data.collectionEfficiency)}`}>{data.collectionEfficiency}%</td>
                      <td className={`py-3 px-4 ${getStatusColor(data.serviceDelay, true)}`}>{data.serviceDelay} min</td>
                      <td className="py-3 px-4">{data.bins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}