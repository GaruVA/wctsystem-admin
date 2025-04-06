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
import { Button } from "@/components/ui/button";
import BinMap from "@/components/dashboard/bin-map";
import { 
  RefreshCcw, 
  Trash2, 
  Truck,
  ArrowUpRight,
  Percent,
  Map,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";
import { cn } from "@/lib/utils";

const api = axios.create({
  baseURL: "http://localhost:5000/api", 
});

interface AnalyticsData {
  [areaId: string]: {
    utilization: number;
    collectionEfficiency: number;
    serviceDelay: number;
    bins: number;
    wasteTypeDistribution: Record<string, number>;
  };
}

interface Alert {
  id: string;
  title: string;
  description: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  type: string;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const [overallStats, setOverallStats] = useState({
    avgUtilization: 0,
    totalBins: 0,
    avgEfficiency: 0,
    avgDelay: 0,
    criticalBins: 0,
    routeCompletion: 75 // Simulated data, replace with actual data when available
  });

  useEffect(() => {
    fetchAnalytics();
    fetchAreas();
    generateMockAlerts(); // Replace with real alerts API when available
  }, []);

  useEffect(() => {
    if (analytics) {
      const areas = Object.values(analytics);
      const totalBins = areas.reduce((acc, area) => acc + area.bins, 0);
      const avgUtil = areas.reduce((acc, area) => acc + area.utilization, 0) / areas.length;
      const avgEff = areas.reduce((acc, area) => acc + area.collectionEfficiency, 0) / areas.length;
      const avgDelay = areas.reduce((acc, area) => acc + area.serviceDelay, 0) / areas.length;

      // Get count of bins with fill level > 80%
      let criticalBinsCount = 0;
      areas.forEach(area => {
        if (area && typeof area === 'object' && 'bins' in area) {
          const bins = area.bins;
          if (Array.isArray(bins)) {
            criticalBinsCount += bins.filter(bin => bin && bin.fillLevel > 80).length;
          }
        }
      });

      setOverallStats({
        totalBins,
        avgUtilization: avgUtil,
        avgEfficiency: avgEff,
        avgDelay: avgDelay,
        criticalBins: criticalBinsCount || Math.round(totalBins * 0.15), // Fallback to estimation
        routeCompletion: 75 // Simulated data
      });
    }
  }, [analytics]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get("/analytics/analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setAnalytics(response.data as AnalyticsData);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch analytics data");
      
      // Mock data for development
      setAnalytics({
        "Area-001": { 
          utilization: 78, 
          collectionEfficiency: 92, 
          serviceDelay: 12, 
          bins: 34,
          wasteTypeDistribution: {
            "GENERAL": 15,
            "ORGANIC": 8,
            "RECYCLE": 7,
            "HAZARDOUS": 4
          }
        },
        "Area-002": { 
          utilization: 65, 
          collectionEfficiency: 87, 
          serviceDelay: 18, 
          bins: 28,
          wasteTypeDistribution: {
            "GENERAL": 12,
            "ORGANIC": 6,
            "RECYCLE": 7,
            "HAZARDOUS": 3
          }
        },
        "Area-003": { 
          utilization: 83, 
          collectionEfficiency: 95, 
          serviceDelay: 8, 
          bins: 42,
          wasteTypeDistribution: {
            "GENERAL": 20,
            "ORGANIC": 10,
            "RECYCLE": 8,
            "HAZARDOUS": 4
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      setAreasLoading(true);
      const areasData = await getAllAreasWithBins();
      setAreas(areasData);
      setAreasError(null);
    } catch (err) {
      console.error('Error fetching areas with bins:', err);
      setAreasError('Failed to load areas data. Please try again later.');
    } finally {
      setAreasLoading(false);
    }
  };

  // Generate mock alerts - replace with real API call when available
  const generateMockAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        title: 'Critical Bin Level',
        description: 'Bin HZ-789 has reached 95% capacity in Wellawatte South',
        time: '2 minutes ago',
        severity: 'high',
        type: 'bin'
      },
      {
        id: '2',
        title: 'Collection Route Completed',
        description: 'Collector John Smith has completed Route #34',
        time: '15 minutes ago',
        severity: 'medium',
        type: 'route'
      },
      {
        id: '3',
        title: 'System Maintenance',
        description: 'Scheduled maintenance on April 10, 2025 from 2-4am',
        time: '1 hour ago',
        severity: 'low',
        type: 'system'
      }
    ];
    
    setAlerts(mockAlerts);
  };

  const handleBinSelect = (bin: Bin | null) => {
    setSelectedBin(bin);
  };

  const getStatusColor = (value: number, isDelay = false) => {
    if (isDelay) {
      return value < 10 ? 'text-green-500' : value < 20 ? 'text-amber-500' : 'text-red-500';
    }
    return value > 80 ? 'text-green-500' : value > 60 ? 'text-amber-500' : 'text-red-500';
  };

  const filteredAreas = selectedArea
    ? areas.filter(area => area.areaID === selectedArea)
    : areas;

  const getAlertIcon = (severity: string, type: string) => {
    if (type === 'bin') return <Trash2 className="h-5 w-5" />;
    if (type === 'route') return <Truck className="h-5 w-5" />;
    if (type === 'system') return <AlertCircle className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getAlertColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'text-red-500 bg-red-100';
      case 'medium': return 'text-amber-500 bg-amber-100';
      case 'low': return 'text-blue-500 bg-blue-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
          >
            Export
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              fetchAnalytics();
              fetchAreas();
              generateMockAlerts();
            }}
            disabled={loading || areasLoading}
          >
            {(loading || areasLoading) ? (
              <RefreshCcw size={16} className="animate-spin mr-2" />
            ) : (
              <RefreshCcw size={16} className="mr-2" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bins</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalBins}</div>
              <p className="text-xs text-muted-foreground">Across all collection areas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {overallStats.avgUtilization.toFixed(1)}%
                <ArrowUpRight className={`h-4 w-4 ${getStatusColor(overallStats.avgUtilization)}`} />
              </div>
              <p className="text-xs text-muted-foreground">+2.5% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Efficiency</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {overallStats.avgEfficiency.toFixed(1)}%
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${overallStats.avgEfficiency}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Bins</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{overallStats.criticalBins}</div>
              <p className="text-xs text-muted-foreground">Bins above 80% fill level</p>
            </CardContent>
          </Card>
        </div>

        {/* Map and Alerts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-3 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map size={18} />
                Waste Collection Areas
              </CardTitle>
              <CardDescription>
                Collection areas with bin locations and boundaries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-[438px]">
              {areasLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {areasError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
                  {areasError}
                </div>
              )}

              {!areasLoading && !areasError && (
                <>
                  <div className="mb-4 flex flex-wrap gap-2 px-6">
                    <button
                      onClick={() => setSelectedArea(null)}
                      className={`px-3 py-1 text-sm rounded ${
                        selectedArea === null
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      All Areas ({areas.length})
                    </button>
                    
                    {areas.map(area => (
                      <button
                        key={area.areaID}
                        onClick={() => setSelectedArea(area.areaID)}
                        className={`px-3 py-1 text-sm rounded ${
                          selectedArea === area.areaID
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {area.areaName} ({area.bins.length})
                      </button>
                    ))}
                  </div>

                  <BinMap 
                    areas={filteredAreas} 
                    fitToAreas={true} 
                    onBinSelect={handleBinSelect}
                    selectedBin={selectedBin}
                    style={{ height: "395px" }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Real-time alerts container */}
          <Card className="col-span-3 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                Real-time Alerts
              </CardTitle>
              <CardDescription>
                System notifications and important updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-4 rounded-md border p-3",
                      alert.severity === "high"
                        ? "border-red-200 bg-red-50"
                        : alert.severity === "medium"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      alert.severity === "high"
                        ? "text-red-500 bg-red-100"
                        : alert.severity === "medium"
                          ? "text-yellow-500 bg-yellow-100"
                          : "text-blue-500 bg-blue-100"
                    )}>
                      {getAlertIcon(alert.severity, alert.type)}
                    </div>
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
