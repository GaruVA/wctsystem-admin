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
  Percent,
  Map
} from "lucide-react";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";

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

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'area' | 'bin'>('overview');
  
  const [overallStats, setOverallStats] = useState({
    avgUtilization: 0,
    totalBins: 0,
    avgEfficiency: 0,
    avgDelay: 0
  });

  useEffect(() => {
    fetchAnalytics();
    fetchAreas();
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

  useEffect(() => {
    if (selectedBin) {
      setActiveView('bin');
    } else if (selectedArea) {
      setActiveView('area');
    } else {
      setActiveView('overview');
    }
  }, [selectedBin, selectedArea]);

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

  const handleBinSelect = (bin: Bin) => {
    setSelectedBin(bin);
  };

  const getStatusColor = (value: number, isDelay = false) => {
    if (isDelay) {
      return value < 10 ? 'text-green-500' : value < 20 ? 'text-amber-500' : 'text-red-500';
    }
    return value > 80 ? 'text-green-500' : value > 60 ? 'text-amber-500' : 'text-red-500';
  };

  const getCurrentAreaDetails = () => {
    if (!selectedArea) return null;
    return areas.find(area => area.areaID === selectedArea);
  };

  const filteredAreas = selectedArea
    ? areas.filter(area => area.areaID === selectedArea)
    : areas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => {
            fetchAnalytics();
            fetchAreas();
          }}
          disabled={loading || areasLoading}
        >
          <RefreshCcw size={16} className={loading || areasLoading ? 'animate-spin' : ''} /> 
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

      {/* Area Map Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              <span>Waste Collection Areas</span>
              <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Live view
              </div>
            </CardTitle>
            <CardDescription>
              Collection areas with bin locations and boundaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {areasLoading && (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {areasError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {areasError}
              </div>
            )}

            {!areasLoading && !areasError && (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
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

                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Map section (3/4 width) */}
                  <div className="lg:w-3/4 rounded-md overflow-hidden border border-gray-200">
                    <BinMap 
                      areas={filteredAreas} 
                      fitToAreas={true} 
                      onBinSelect={handleBinSelect}
                      selectedBin={selectedBin}
                      style={{ height: "500px" }}
                    />
                  </div>
                  
                  {/* Details panel (1/4 width) */}
                  <div className="lg:w-1/4 flex flex-col">
                    {selectedBin ? (
                      <div className="h-full p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${selectedBin.fillLevel >= 80 ? 'bg-red-500' : selectedBin.fillLevel >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                            <h3 className="font-semibold">Bin Details</h3>
                          </div>
                          <button 
                            onClick={() => setSelectedBin(null)}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label="Close bin details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-4 flex-1">
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
                          {selectedBin.address && (
                            <div>
                              <p className="text-xs text-gray-500">Address</p>
                              <p className="font-medium break-words">{selectedBin.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedArea ? (
                      // Area details when an area is selected but no bin
                      <div className="h-full p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col">
                        {(() => {
                          const areaDetails = getCurrentAreaDetails();
                          const areaAnalytics = analytics && analytics[selectedArea];
                          
                          if (!areaDetails) return <div>Loading area details...</div>;
                          
                          return (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <h3 className="font-semibold">Area Details</h3>
                                </div>
                                <button 
                                  onClick={() => setSelectedArea(null)}
                                  className="text-gray-500 hover:text-gray-700"
                                  aria-label="Close area details"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </button>
                              </div>

                              <div className="space-y-4 flex-1">
                                <div>
                                  <p className="text-xs text-gray-500">Area Name</p>
                                  <p className="font-medium">{areaDetails.areaName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Area ID</p>
                                  <p className="font-medium">{areaDetails.areaID}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Total Bins</p>
                                  <p className="font-medium">{areaDetails.bins.length}</p>
                                </div>
                                
                                {areaAnalytics && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-500">Utilization</p>
                                      <p className={`font-medium ${getStatusColor(areaAnalytics.utilization)}`}>
                                        {areaAnalytics.utilization}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Collection Efficiency</p>
                                      <p className={`font-medium ${getStatusColor(areaAnalytics.collectionEfficiency)}`}>
                                        {areaAnalytics.collectionEfficiency}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Service Delay</p>
                                      <p className={`font-medium ${getStatusColor(areaAnalytics.serviceDelay, true)}`}>
                                        {areaAnalytics.serviceDelay} min
                                      </p>
                                    </div>
                                  </>
                                )}
                                
                                <div>
                                  <p className="text-xs text-gray-500">Start Location</p>
                                  <p className="font-medium">
                                    {areaDetails.startLocation.coordinates[1].toFixed(4)}, 
                                    {areaDetails.startLocation.coordinates[0].toFixed(4)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">End Location</p>
                                  <p className="font-medium">
                                    {areaDetails.endLocation.coordinates[1].toFixed(4)}, 
                                    {areaDetails.endLocation.coordinates[0].toFixed(4)}
                                  </p>
                                </div>
                                
                                <div className="mt-4">
                                  <p className="text-xs font-medium text-blue-600">Bin Status</p>
                                  <div className="mt-2 flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      <p className="text-xs mt-1">
                                        {areaDetails.bins.filter(b => b.fillLevel >= 80).length}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                      <p className="text-xs mt-1">
                                        {areaDetails.bins.filter(b => b.fillLevel >= 50 && b.fillLevel < 80).length}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <p className="text-xs mt-1">
                                        {areaDetails.bins.filter(b => b.fillLevel < 50).length}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      // No selection state
                      <div className="h-full p-4 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center text-center">
                        <div className="text-gray-500">
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <p className="mt-2 font-medium">Select an area or bin to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
