"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Route, Calendar, Clock, Truck, Filter, 
  MapPin, Save, AlertCircle, Trash, PlusCircle, 
  MinusCircle, CheckCircle 
} from "lucide-react";
import BinMap from "@/components/dashboard/bin-map";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";
import { getOptimizedRoute, saveRouteSchedule, OptimizedRoute } from "@/lib/api/routes";
import { getActiveCollectors } from "@/lib/api/collectors";
import { Collector } from "@/lib/types/collector";

// API base URL for direct fetch calls
const API_BASE_URL = 'http://localhost:5000/api';

interface RouteSchedule {
  id: string;
  name: string;
  areaId: string;
  areaName?: string;
  collectorId: string;
  collectorName: string;
  startTime: string;
  endTime?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  bins: number;
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium rounded-t-lg ${
      isActive
        ? "bg-white text-blue-600 border-t border-l border-r border-gray-300"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {label}
  </button>
);

export default function SchedulePage() {
  // State for tabs
  const [activeTab, setActiveTab] = useState<'schedules' | 'routeBuilder'>('schedules');

  // State for schedules table
  const [schedules, setSchedules] = useState<RouteSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(false);

  // State for route builder
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaWithBins | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeName, setRouteName] = useState<string>("");
  const [selectedBins, setSelectedBins] = useState<Set<string>>(new Set());
  const [excludedBins, setExcludedBins] = useState<Set<string>>(new Set());
  const [fillLevelThreshold, setFillLevelThreshold] = useState<number>(70);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [routeStats, setRouteStats] = useState<{
    distance: string;
    duration: string;
    binCount: number;
  }>({
    distance: "0 km",
    duration: "0 min",
    binCount: 0,
  });
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // State for collectors
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  const [isLoadingCollectors, setIsLoadingCollectors] = useState<boolean>(false);

  // Fetch schedules when component mounts
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        // Call our API to get real schedules
        const response = await fetch(`${API_BASE_URL}/schedules`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch schedules: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map API response to our component's schedule format
        const formattedSchedules = data.data.map((schedule: any) => ({
          id: schedule._id,
          name: schedule.name,
          areaId: schedule.areaId?._id || schedule.areaId,
          areaName: schedule.areaId?.name || 'Unknown Area',
          collectorId: schedule.collectorId?._id || schedule.collectorId || '',
          collectorName: schedule.collectorId 
            ? `${schedule.collectorId.firstName} ${schedule.collectorId.lastName}` 
            : 'Unassigned',
          startTime: schedule.startTime || new Date(schedule.date).toISOString(),
          endTime: schedule.endTime || '',
          status: schedule.status,
          bins: schedule.route.includedBins?.length || 0
        }));
        
        setSchedules(formattedSchedules);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        // Fallback to mock data if API call fails
        setSchedules([
          {
            id: "SCH001",
            name: "Morning Route A",
            areaId: "Area-001",
            areaName: "Wellawatte South",
            collectorId: "COL001",
            collectorName: "John Smith",
            startTime: "2025-03-30T08:00:00Z",
            endTime: "2025-03-30T12:00:00Z",
            status: "scheduled",
            bins: 34
          },
          {
            id: "SCH002",
            name: "Afternoon Route B",
            areaId: "Area-002",
            areaName: "Pamankada West",
            collectorId: "COL002",
            collectorName: "Sarah Johnson",
            startTime: "2025-03-30T13:00:00Z",
            endTime: "2025-03-30T17:00:00Z",
            status: "in-progress",
            bins: 28
          }
        ]);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    if (activeTab === 'schedules') {
      fetchSchedules();
    }
  }, [activeTab]);

  // Fetch areas when component mounts
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAllAreasWithBins();
        setAreas(areasData);
        // Select the first area by default
        if (areasData.length > 0) {
          setSelectedArea(areasData[0]);
        }
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };

    fetchAreas();
  }, []);

  // Fetch collectors when component mounts
  useEffect(() => {
    const fetchCollectors = async () => {
      setIsLoadingCollectors(true);
      try {
        const data = await getActiveCollectors();
        setCollectors(data.collectors || []);
      } catch (error) {
        console.error("Error fetching collectors:", error);
      } finally {
        setIsLoadingCollectors(false);
      }
    };

    fetchCollectors();
  }, []);

  // Handle area selection
  const handleAreaChange = (areaId: string) => {
    const area = areas.find((a) => a.areaID === areaId);
    setSelectedArea(area || null);
    // Reset route and selections when changing areas
    setOptimizedRoute(null);
    setSelectedBins(new Set());
    setExcludedBins(new Set());
    setSelectedBin(null);
  };

  // Generate route based on selected area and options
  const generateRoute = async () => {
    if (!selectedArea) return;

    setIsLoadingRoute(true);
    try {
      // Get all bins in the selected area
      const allBins = selectedArea.bins || [];
      
      // Default is to include bins based on threshold
      // The includeIds will override threshold for bins we specifically want to include
      // The excludeIds will exclude bins even if they meet the threshold
      const options = {
        includeIds: Array.from(selectedBins),
        excludeIds: Array.from(excludedBins),
        fillLevelThreshold
      };

      console.log("Route options:", options);

      const optimizedRouteData = await getOptimizedRoute(selectedArea.areaID, options);
      setOptimizedRoute(optimizedRouteData.route);
      
      // Update route stats
      setRouteStats({
        distance: optimizedRouteData.route.distance,
        duration: optimizedRouteData.route.duration,
        binCount: optimizedRouteData.totalBins || 0
      });
    } catch (error) {
      console.error("Error generating route:", error);
      alert("Failed to generate route. Please try again.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Refresh schedules after saving a new one
  const refreshSchedules = () => {
    if (activeTab === 'schedules') {
      // Fetch schedules again
      const fetchSchedules = async () => {
        setIsLoadingSchedules(true);
        try {
          const response = await fetch(`${API_BASE_URL}/schedules`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch schedules: ${response.status}`);
          }
          
          const data = await response.json();
          
          const formattedSchedules = data.data.map((schedule: any) => ({
            id: schedule._id,
            name: schedule.name,
            areaId: schedule.areaId?._id || schedule.areaId,
            areaName: schedule.areaId?.name || 'Unknown Area',
            collectorId: schedule.collectorId?._id || schedule.collectorId || '',
            collectorName: schedule.collectorId 
              ? `${schedule.collectorId.firstName} ${schedule.collectorId.lastName}` 
              : 'Unassigned',
            startTime: schedule.startTime || new Date(schedule.date).toISOString(),
            endTime: schedule.endTime || '',
            status: schedule.status,
            bins: schedule.route.includedBins?.length || 0
          }));
          
          setSchedules(formattedSchedules);
        } catch (error) {
          console.error('Error refreshing schedules:', error);
        } finally {
          setIsLoadingSchedules(false);
        }
      };

      fetchSchedules();
    }
  };

  // Save the current route as a schedule
  const saveRoute = async () => {
    if (!selectedArea || !optimizedRoute || !routeName.trim()) {
      alert("Please generate a route and provide a name before saving.");
      return;
    }

    try {
      // Create a schedule data object
      const scheduleData = {
        name: routeName,
        areaId: selectedArea.areaID,
        collectorId: selectedCollector || undefined, // Include collector if selected
        date: currentDate,
        route: {
          coordinates: optimizedRoute.route,
          distance: optimizedRoute.distance,
          duration: optimizedRoute.duration,
          includedBins: Array.from(selectedBins),
          excludedBins: Array.from(excludedBins),
          fillLevelThreshold
        },
        status: "scheduled"
      };

      console.log("Saving schedule with data:", scheduleData);

      // Save the schedule
      await saveRouteSchedule(scheduleData);
      
      // Reset form
      setRouteName("");
      setSelectedCollector("");
      setOptimizedRoute(null);
      setSelectedBins(new Set());
      setExcludedBins(new Set());
      
      // Switch to schedules tab and refresh the list
      setActiveTab('schedules');
      refreshSchedules();
      
      alert("Route schedule saved successfully!");
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save route schedule. Please try again.");
    }
  };

  // Handle bin selection/exclusion
  const toggleBinSelection = (bin: Bin) => {
    const binId = bin._id;
    
    // If the bin is already selected, remove it
    if (selectedBins.has(binId)) {
      const newSelected = new Set(selectedBins);
      newSelected.delete(binId);
      setSelectedBins(newSelected);
      return;
    }
    
    // If the bin is excluded, un-exclude it
    if (excludedBins.has(binId)) {
      const newExcluded = new Set(excludedBins);
      newExcluded.delete(binId);
      setExcludedBins(newExcluded);
      return;
    }
    
    // Otherwise, add it to selected bins
    setSelectedBins(new Set(selectedBins).add(binId));
  };

  // Handle bin exclusion
  const toggleBinExclusion = (bin: Bin) => {
    const binId = bin._id;
    
    // If the bin is already excluded, remove it
    if (excludedBins.has(binId)) {
      const newExcluded = new Set(excludedBins);
      newExcluded.delete(binId);
      setExcludedBins(newExcluded);
      return;
    }
    
    // If the bin is selected, un-select it
    if (selectedBins.has(binId)) {
      const newSelected = new Set(selectedBins);
      newSelected.delete(binId);
      setSelectedBins(newSelected);
    }
    
    // Add to excluded bins
    setExcludedBins(new Set(excludedBins).add(binId));
  };

  const getBinStatus = (bin: Bin) => {
    const binId = bin._id;
    if (selectedBins.has(binId)) return "selected";
    if (excludedBins.has(binId)) return "excluded";
    if (bin.fillLevel >= fillLevelThreshold) return "included";
    return "normal";
  };

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

  const emptyRoute = !optimizedRoute || optimizedRoute.route.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-800">Route Scheduling</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white shadow-sm">
            <Calendar size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}</span>
          </div>
          {activeTab === 'schedules' && (
            <Button onClick={() => setActiveTab('routeBuilder')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700">
              <Route size={18} /> Create New Route
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300">
        <Tab 
          label="Schedules" 
          isActive={activeTab === 'schedules'} 
          onClick={() => setActiveTab('schedules')} 
        />
        <Tab 
          label="Route Builder" 
          isActive={activeTab === 'routeBuilder'} 
          onClick={() => setActiveTab('routeBuilder')} 
        />
      </div>

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              <Route className="h-6 w-6 text-blue-600" />
              Collection Routes
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              View and manage all scheduled waste collection routes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-md">
                <thead className="bg-gray-100">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Area</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Collector</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Schedule Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Bins</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{schedule.name}</td>
                      <td className="py-3 px-4 text-gray-700">{schedule.areaName || schedule.areaId}</td>
                      <td className="py-3 px-4 text-gray-700">{schedule.collectorName}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(schedule.startTime).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{schedule.bins}</td>
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
      )}

      {/* Route Builder Tab */}
      {activeTab === 'routeBuilder' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
                  <Route size={20} className="text-blue-600" />
                  Route Builder
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Generate optimized collection routes based on bin fill levels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Route Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="routeName" className="text-sm font-medium text-gray-700">Route Name</Label>
                  <Input
                    id="routeName"
                    placeholder="Enter route name"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="border-gray-300 shadow-sm"
                  />
                </div>
                
                {/* Area Selection */}
                <div className="space-y-2">
                  <Label htmlFor="areaSelect" className="text-sm font-medium text-gray-700">Select Area</Label>
                  <select
                    id="areaSelect"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    value={selectedArea?.areaID || ""}
                    onChange={(e) => handleAreaChange(e.target.value)}
                  >
                    {areas.map((area) => (
                      <option key={area.areaID} value={area.areaID}>
                        {area.areaName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Fill Level Threshold */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="fillLevelThreshold" className="text-sm font-medium text-gray-700">Fill Level Threshold</Label>
                    <span className="text-sm text-gray-500">{fillLevelThreshold}%</span>
                  </div>
                  <input
                    id="fillLevelThreshold"
                    type="range"
                    min="0"
                    max="100"
                    value={fillLevelThreshold}
                    onChange={(e) => setFillLevelThreshold(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Bins with fill level at or above this threshold will be included in the route.
                  </p>
                </div>

                {/* Date Selection for scheduling */}
                <div className="space-y-2">
                  <Label htmlFor="routeDate" className="text-sm font-medium text-gray-700">Schedule Date</Label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                    <Calendar className="mx-2 text-gray-500" size={16} />
                    <input
                      id="routeDate"
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      className="flex-1 p-2 outline-none"
                    />
                  </div>
                </div>

                {/* Collector Selection */}
                <div className="space-y-2">
                  <Label htmlFor="collectorSelect" className="text-sm font-medium text-gray-700">Assign Collector</Label>
                  <select
                    id="collectorSelect"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    value={selectedCollector}
                    onChange={(e) => setSelectedCollector(e.target.value)}
                    disabled={isLoadingCollectors}
                  >
                    <option value="">-- Select Collector --</option>
                    {collectors.map((collector) => (
                      <option key={collector._id} value={collector._id}>
                        {`${collector.firstName} ${collector.lastName}`}
                      </option>
                    ))}
                  </select>
                  {isLoadingCollectors && <p className="text-xs text-gray-500">Loading collectors...</p>}
                </div>

                {/* Generate and Save buttons */}
                <div className="space-y-4 pt-4">
                  <Button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
                    onClick={generateRoute}
                    disabled={isLoadingRoute || !selectedArea}
                  >
                    {isLoadingRoute ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Route size={16} /> Generate Route
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-100"
                    onClick={saveRoute}
                    disabled={emptyRoute || !routeName.trim() || isLoadingRoute}
                  >
                    <Save size={16} /> Save Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Route Stats */}
            {!emptyRoute && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-800">Route Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="text-lg font-medium text-gray-800">{routeStats.distance}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-lg font-medium text-gray-800">{routeStats.duration}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Bins</p>
                      <p className="text-lg font-medium text-gray-800">{routeStats.binCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Bin Information */}
            {selectedBin && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                    <MapPin size={16} className="text-blue-600" /> 
                    Selected Bin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fill Level:</span>
                    <span className="font-medium text-gray-800">{selectedBin.fillLevel}%</span>
                  </div>
                  {selectedBin.address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-medium max-w-[200px] text-right text-gray-800">{selectedBin.address}</span>
                    </div>
                  )}
                  {selectedBin.lastCollected && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Collected:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(selectedBin.lastCollected).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-100"
                      onClick={() => toggleBinSelection(selectedBin)}
                    >
                      {selectedBins.has(selectedBin._id) ? (
                        <>
                          <MinusCircle size={14} className="mr-1" /> Remove
                        </>
                      ) : (
                        <>
                          <PlusCircle size={14} className="mr-1" /> Include
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-100"
                      onClick={() => toggleBinExclusion(selectedBin)}
                    >
                      {excludedBins.has(selectedBin._id) ? (
                        <>
                          <CheckCircle size={14} className="mr-1" /> Un-exclude
                        </>
                      ) : (
                        <>
                          <Trash size={14} className="mr-1" /> Exclude
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-[700px]">
                {selectedArea && (
                  <BinMap
                    singleArea={selectedArea}
                    optimizedRoute={optimizedRoute?.route || []}
                    fitToRoute={!emptyRoute}
                    onBinSelect={setSelectedBin}
                    selectedBin={selectedBin}
                    style={{ height: '100%', borderRadius: '0.375rem' }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-4 px-2">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                    <span className="text-xs text-gray-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                    <span className="text-xs text-gray-600">Excluded</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500 border border-white"></div>
                    <span className="text-xs text-gray-600">{`≥ ${fillLevelThreshold}% Full`}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Click on bins to include or exclude them manually</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}