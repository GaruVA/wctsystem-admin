"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import BinMap from "@/components/dashboard/bin-map";
import { 
  BarChart3, 
  Clock, 
  RefreshCcw, 
  Trash2, 
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from "lucide-react";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your actual backend URL
});

interface AnalyticsData {
  [areaId: string]: {
    utilization: number;
    collectionEfficiency: number;
    serviceDelay: number;
    bins: number;
  };
}

// Define Bin interface to match the MongoDB structure
interface Bin {
  _id: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  fillLevel: number;
  lastCollected: string;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [overallStats, setOverallStats] = useState({
    avgUtilization: 0,
    totalBins: 0,
    avgEfficiency: 0,
    avgDelay: 0
  });
  
  // Hardcoded bins data based on provided MongoDB structure
  const mockBins: Bin[] = [
    {
      _id: "67cbf9384d042a183ab3e095",
      location: {
        type: "Point",
        coordinates: [-73.9568, 40.7789] // Central Park NYC area
      },
      fillLevel: 60,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e096",
      location: {
        type: "Point",
        coordinates: [-73.9708, 40.7648] // Times Square NYC area
      },
      fillLevel: 85,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e097",
      location: {
        type: "Point",
        coordinates: [-73.9632, 40.7831] // Upper East Side NYC area
      },
      fillLevel: 45,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e098",
      location: {
        type: "Point",
        coordinates: [-73.9932, 40.7362] // Chelsea NYC area
      },
      fillLevel: 95,
      lastCollected: new Date().toISOString()
    },
    {
      _id: "67cbf9384d042a183ab3e099",
      location: {
        type: "Point",
        coordinates: [-74.0099, 40.7047] // Financial District NYC area
      },
      fillLevel: 72,
      lastCollected: new Date().toISOString()
    }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analytics) {
      const areas = Object.values(analytics);
      const totalBins = areas.reduce((acc, area) => acc + area.bins, 0);
      const avgUtil = areas.reduce((acc, area) => acc + area.utilization, 0) / areas.length;
      const avgEff = areas.reduce((acc, area) => acc + area.collectionEfficiency, 0) / areas.length;
      const avgDelay = areas.reduce((acc, area) => acc + area.serviceDelay, 0) / areas.length;

      setOverallStats({
        totalBins,
        avgUtilization: avgUtil,
        avgEfficiency: avgEff,
        avgDelay: avgDelay
      });
    }
  }, [analytics]);

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

  const handleBinSelect = (bin: Bin) => {
    setSelectedBin(bin);
  };

  const getStatusColor = (value: number, isDelay = false) => {
    if (isDelay) {
      return value < 10 ? 'text-green-500' : value < 20 ? 'text-amber-500' : 'text-red-500';
    }
    return value > 80 ? 'text-green-500' : value > 60 ? 'text-amber-500' : 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={fetchAnalytics}
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> 
          Refresh
        </button>
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bins</p>
                <h3 className="text-2xl font-bold mt-1">{overallStats.totalBins}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Trash2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Utilization</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center">
                  {overallStats.avgUtilization.toFixed(1)}%
                  <ArrowUpRight className={`h-4 w-4 ml-1 ${getStatusColor(overallStats.avgUtilization)}`} />
                </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Collection Efficiency</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center">
                  {overallStats.avgEfficiency.toFixed(1)}%
                  <ArrowUpRight className={`h-4 w-4 ml-1 ${getStatusColor(overallStats.avgEfficiency)}`} />
                </h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Service Delay</p>
                <h3 className="text-2xl font-bold mt-1 flex items-center">
                  {overallStats.avgDelay.toFixed(1)} min
                  <ArrowDownRight className={`h-4 w-4 ml-1 ${getStatusColor(overallStats.avgDelay, true)}`} />
                </h3>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <span>Waste Bin Map</span>
              <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Live view
              </div>
            </CardTitle>
            <CardDescription>
              Current bin locations and fill levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-hidden border border-gray-200">
              <BinMap 
                bins={mockBins} 
                onBinSelect={handleBinSelect}
                selectedBin={selectedBin}
              />
            </div>
            {selectedBin && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${selectedBin.fillLevel >= 80 ? 'bg-red-500' : selectedBin.fillLevel >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                  <h3 className="font-medium">Bin Details</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-gray-500">Bin ID</p>
                    <p className="font-medium">{selectedBin._id.substring(0, 8)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fill Level</p>
                    <p className="font-medium">{selectedBin.fillLevel}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">{selectedBin.location.coordinates[1].toFixed(4)}, {selectedBin.location.coordinates[0].toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Collected</p>
                    <p className="font-medium">{new Date(selectedBin.lastCollected).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Area Performance</span>
            </CardTitle>
            <CardDescription>
              Key metrics by collection area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Area ID</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Utilization</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Collection Efficiency</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Service Delay (min)</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Bins</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(analytics).map((areaId) => (
                    <tr key={areaId} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{areaId}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analytics[areaId].utilization)}`}>
                          {analytics[areaId].utilization}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analytics[areaId].collectionEfficiency)}`}>
                          {analytics[areaId].collectionEfficiency}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analytics[areaId].serviceDelay, true)}`}>
                          {analytics[areaId].serviceDelay}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{analytics[areaId].bins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
