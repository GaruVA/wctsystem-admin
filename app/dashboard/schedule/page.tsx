"use client";

import { useState, useEffect, useMemo } from "react";
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
  MapPin, Save, AlertCircle, Trash, Trash2, PlusCircle, 
  MinusCircle, CheckCircle, MoveVertical, Grid, Plus
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
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Adding state for route adjustment mode
  const [isAdjustmentMode, setIsAdjustmentMode] = useState<boolean>(false);
  const [originalRoute, setOriginalRoute] = useState<any>(null);
  const [modifiedRoute, setModifiedRoute] = useState<any>(null);

  // State for route bin table
  const [routeBins, setRouteBins] = useState<Array<{bin: Bin, index: number}>>([]);
  const [draggedBinIndex, setDraggedBinIndex] = useState<number | null>(null);
  const [manualCoordinate, setManualCoordinate] = useState<{lat: string, lng: string}>({lat: '', lng: ''});
  const [manualCoordinateError, setManualCoordinateError] = useState<string | null>(null);

  // State for collectors
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  const [isLoadingCollectors, setIsLoadingCollectors] = useState<boolean>(false);

  // Define route statistics state
  const [routeStats, setRouteStats] = useState<{
    distance: string;
    duration: string;
    binCount: number;
  }>({
    distance: "0 km",
    duration: "0 min",
    binCount: 0,
  });

  // Function to refresh the schedules list
  const refreshSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
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
      console.error('Error fetching schedules:', error);
      if (process.env.NODE_ENV !== 'production') {
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
      }
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Fetch schedules when component mounts
  useEffect(() => {
    if (activeTab === 'schedules') {
      refreshSchedules();
    }
  }, [activeTab]);

  // Fetch areas when component mounts
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAllAreasWithBins();
        setAreas(areasData);
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
    setOptimizedRoute(null);
    setSelectedBins(new Set());
    setExcludedBins(new Set());
    setSelectedBin(null);
  };

  // Update route bins when optimized route changes
  useEffect(() => {
    if (optimizedRoute && selectedArea) {
      // Map bin objects to route sequence
      const binMap = new Map<string, Bin>();
      selectedArea.bins.forEach(bin => {
        binMap.set(bin._id, bin);
      });
      
      // Create array of bin objects in route order
      let newRouteBins: Array<{bin: Bin, index: number}> = [];
      
      // Handle route from API response (typically has includedBins array)
      if (originalRoute?.includedBins && Array.isArray(originalRoute.includedBins)) {
        console.log('Using included bins from original route');
        // Use the bins from the includedBins array
        
        const includedBinIds = originalRoute.includedBins;
        
        // Filter out any excluded bins from the current state
        const filteredBinIds = includedBinIds.filter((id: string) => !excludedBins.has(id));
        
        // Build the route bins from the filtered list
        filteredBinIds.forEach((binId: string, index: number) => {
          // Find the bin in the area
          const bin = selectedArea.bins.find(b => b._id === binId);
          if (bin) {
            newRouteBins.push({
              bin,
              index
            });
          }
        });
        
        // Add any manually selected bins that weren't in the original route
        selectedBins.forEach((binId: string) => {
          // Check if it's a waypoint (custom added point)
          if (binId.startsWith('waypoint-')) {
            // Find this waypoint in the current routeBins
            const waypointBin = routeBins.find(rb => rb.bin._id === binId)?.bin;
            if (waypointBin) {
              newRouteBins.push({
                bin: waypointBin,
                index: newRouteBins.length
              });
            }
          } 
          // Or if it's a regular bin not already in the list
          else if (!filteredBinIds.includes(binId)) {
            const bin = selectedArea.bins.find(b => b._id === binId);
            if (bin) {
              newRouteBins.push({
                bin,
                index: newRouteBins.length
              });
            }
          }
        });
      }
      // Use stops_sequence from optimized route if available
      else if (optimizedRoute.stops_sequence) {
        console.log('Using stops_sequence from optimized route');
        optimizedRoute.stops_sequence.forEach((binIndex, routeIndex) => {
          // Check if index is valid for the area bins array
          if (binIndex >= 0 && binIndex < selectedArea.bins.length) {
            const bin = selectedArea.bins[binIndex];
            // Only add the bin if it's not in the excludedBins set
            if (!excludedBins.has(bin._id)) {
              newRouteBins.push({
                bin,
                index: routeIndex
              });
            }
          }
        });
        
        // Add any custom waypoints from selectedBins
        selectedBins.forEach(binId => {
          if (binId.startsWith('waypoint-')) {
            // Find this waypoint in the current routeBins
            const waypointBin = routeBins.find(rb => rb.bin._id === binId)?.bin;
            if (waypointBin) {
              newRouteBins.push({
                bin: waypointBin,
                index: newRouteBins.length
              });
            }
          }
        });
      } 
      // Default to using bins from the area based on fill level threshold
      else {
        console.log('Using default bin selection based on fill level');
        selectedArea.bins
          .filter(bin => {
            // Include bin if:
            // 1. It's explicitly selected, or
            // 2. It meets the threshold and is not explicitly excluded
            return (
              selectedBins.has(bin._id) || 
              (bin.fillLevel >= fillLevelThreshold && !excludedBins.has(bin._id))
            );
          })
          .forEach((bin, index) => {
            newRouteBins.push({
              bin,
              index
            });
          });
      }
      
      // Sort by index to maintain proper order
      newRouteBins.sort((a, b) => a.index - b.index);
      
      // Re-index to ensure consecutive ordering
      newRouteBins.forEach((item, idx) => {
        item.index = idx;
      });
      
      console.log(`Updated route waypoints: ${newRouteBins.length} bins`);
      setRouteBins(newRouteBins);
    } else {
      setRouteBins([]);
    }
  }, [optimizedRoute, selectedArea, excludedBins, fillLevelThreshold, selectedBins, originalRoute]);

  // Handle bin drag start
  const handleDragStart = (index: number) => {
    setDraggedBinIndex(index);
  };

  // Handle bin drag over
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    if (draggedBinIndex === null || draggedBinIndex === index) return;
    
    const newBins = [...routeBins];
    const movedBin = newBins[draggedBinIndex];
    newBins.splice(draggedBinIndex, 1);
    newBins.splice(index, 0, movedBin);
    
    newBins.forEach((bin, idx) => {
      bin.index = idx;
    });
    
    setRouteBins(newBins);
    setDraggedBinIndex(index);
    
    if (!isAdjustmentMode) {
      setIsAdjustmentMode(true);
    }
  };

  // Handle bin drag end
  const handleDragEnd = () => {
    setDraggedBinIndex(null);
    const binIds = routeBins.map(routeBin => routeBin.bin._id);
    adjustRoute();
  };

  // Handle excluding a bin from the route
  const handleExcludeBin = (binId: string) => {
    setExcludedBins(new Set(excludedBins).add(binId));
    
    if (selectedBins.has(binId)) {
      const newSelected = new Set(selectedBins);
      newSelected.delete(binId);
      setSelectedBins(newSelected);
    }
    
    setRouteBins(routeBins.filter(routeBin => routeBin.bin._id !== binId));
    
    if (!isAdjustmentMode) {
      setIsAdjustmentMode(true);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Add manual coordinate as waypoint
  const addManualWaypoint = () => {
    try {
      setManualCoordinateError(null);
      const lat = parseFloat(manualCoordinate.lat);
      const lng = parseFloat(manualCoordinate.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        setManualCoordinateError("Please enter valid numbers");
        return;
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setManualCoordinateError("Coordinates out of valid range");
        return;
      }
      
      const waypoint: Bin = {
        _id: `waypoint-${Date.now()}`,
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        fillLevel: 100,
        lastCollected: new Date().toISOString(),
        address: `Custom waypoint (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        wasteTypes: ""
      };
      
      setRouteBins([...routeBins, {
        bin: waypoint,
        index: routeBins.length
      }]);
      
      setSelectedBins(new Set(selectedBins).add(waypoint._id));
      
      setManualCoordinate({lat: '', lng: ''});
      
      if (!isAdjustmentMode) {
        setIsAdjustmentMode(true);
      }
    } catch (error) {
      console.error("Error adding manual waypoint:", error);
      setManualCoordinateError("Invalid coordinates");
    }
  };

  // Helper function to get the status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle bin selection for include/exclude
  const toggleBinSelection = (bin: Bin) => {
    const binId = bin._id;
    
    // If bin is already excluded, remove from excluded and potentially add to selected
    if (excludedBins.has(binId)) {
      const newExcluded = new Set(excludedBins);
      newExcluded.delete(binId);
      setExcludedBins(newExcluded);
      
      // Only add to selected if it wouldn't be included by default (below threshold)
      if (bin.fillLevel < fillLevelThreshold) {
        const newSelected = new Set(selectedBins);
        newSelected.add(binId);
        setSelectedBins(newSelected);
      }
    }
    // If bin is already specifically selected, remove it from selected (will be excluded if below threshold)
    else if (selectedBins.has(binId)) {
      const newSelected = new Set(selectedBins);
      newSelected.delete(binId);
      setSelectedBins(newSelected);
      
      // Exclude the bin if it's below the threshold
      if (bin.fillLevel < fillLevelThreshold) {
        const newExcluded = new Set(excludedBins);
        newExcluded.add(binId);
        setExcludedBins(newExcluded);
      }
    }
    // Otherwise, toggle between included and excluded based on fill level
    else {
      if (bin.fillLevel >= fillLevelThreshold) {
        // Bin would be included by default, so we exclude it
        const newExcluded = new Set(excludedBins);
        newExcluded.add(binId);
        setExcludedBins(newExcluded);
      } else {
        // Bin would be excluded by default, so we include it
        const newSelected = new Set(selectedBins);
        newSelected.add(binId);
        setSelectedBins(newSelected);
      }
    }
    
    // Set adjustment mode flag
    if (!isAdjustmentMode) {
      setIsAdjustmentMode(true);
    }
  };

  // Apply route adjustments
  const adjustRoute = async () => {
    if (!selectedArea || !originalRoute) return;
    
    setIsLoadingRoute(true);
    try {
      // Prepare the bin order
      const binOrder = routeBins.map(routeBin => routeBin.bin._id);
      
      // Prepare arrays of included and excluded bin IDs
      const includeBins = Array.from(selectedBins);
      const excludeBins = Array.from(excludedBins);
      
      // Call the API to adjust the route
      const response = await fetch(`${API_BASE_URL}/route-optimization/adjust-existing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          areaId: selectedArea.areaID,
          existingRoute: originalRoute,
          includeBins,
          excludeBins,
          binOrder
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to adjust route: ${response.status}`);
      }
      
      const adjustedData = await response.json();
      
      // Update the route and related state
      setOptimizedRoute(adjustedData.route);
      setModifiedRoute(adjustedData);
      
      // Update route stats
      setRouteStats({
        distance: adjustedData.route.distance,
        duration: adjustedData.route.duration,
        binCount: adjustedData.totalBins || 0,
      });
      
    } catch (error) {
      console.error('Error adjusting route:', error);
      alert('Failed to adjust route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Reset to original route
  const resetAdjustments = () => {
    if (!originalRoute) return;
    
    // Reset selections
    setSelectedBins(new Set());
    setExcludedBins(new Set());
    setSelectedBin(null);
    setIsAdjustmentMode(false);
    
    // Restore original route
    setOptimizedRoute(originalRoute.route);
    setModifiedRoute(null);
    
    // Update route stats
    setRouteStats({
      distance: originalRoute.route.distance,
      duration: originalRoute.route.duration,
      binCount: originalRoute.totalBins || 0,
    });
  };

  // Save route to schedule
  const saveRoute = async () => {
    if (!optimizedRoute || !selectedArea || !currentDate || !routeName) {
      alert('Please provide all required information: route name, area, and date.');
      return;
    }
    
    try {
      const routeData = {
        name: routeName,
        areaId: selectedArea.areaID,
        date: currentDate,
        collectorId: selectedCollector || undefined,
        route: modifiedRoute || originalRoute
      };
      
      const response = await saveRouteSchedule(routeData);
      
      if (response.success) {
        alert('Route schedule saved successfully!');
        // Reset form
        setRouteName('');
        setSelectedBins(new Set());
        setExcludedBins(new Set());
        setOptimizedRoute(null);
        setOriginalRoute(null);
        setModifiedRoute(null);
        setIsAdjustmentMode(false);
        
        // Switch to schedules tab
        setActiveTab('schedules');
        refreshSchedules();
      } else {
        alert(`Failed to save route schedule: ${response.message}`);
      }
    } catch (error) {
      console.error('Error saving route schedule:', error);
      alert('Failed to save route schedule. Please try again.');
    }
  };

  // Generate the initial optimized route
  const generateRoute = async () => {
    if (!selectedArea) return;

    setIsAdjustmentMode(false);
    setSelectedBins(new Set());
    setExcludedBins(new Set());
    setSelectedBin(null);
    
    setIsLoadingRoute(true);
    try {
      const options = {
        fillLevelThreshold,
      };

      const response = await fetch(`${API_BASE_URL}/route-optimization/area/${selectedArea.areaID}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to generate route: ${response.status}`);
      }

      const optimizedRouteData = await response.json();
      
      setOriginalRoute(optimizedRouteData);
      setModifiedRoute(null);
      setOptimizedRoute(optimizedRouteData.route);

      setRouteStats({
        distance: optimizedRouteData.route.distance,
        duration: optimizedRouteData.route.duration,
        binCount: optimizedRouteData.totalBins || 0,
      });
    } catch (error) {
      console.error("Error generating route:", error);
      alert("Failed to generate route. Please try again.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Double click on bin to toggle selection
  const handleBinDoubleClick = (bin: Bin) => {
    toggleBinSelection(bin);
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

            {/* Add Custom Waypoint */}
            {!emptyRoute && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Plus className="h-5 w-5 text-blue-600" /> 
                    Add Waypoint
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">Latitude</Label>
                        <Input
                          id="latitude"
                          placeholder="e.g. 6.9271"
                          value={manualCoordinate.lat}
                          onChange={(e) => setManualCoordinate({...manualCoordinate, lat: e.target.value})}
                          className="border-gray-300 shadow-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">Longitude</Label>
                        <Input
                          id="longitude"
                          placeholder="e.g. 79.8612"
                          value={manualCoordinate.lng}
                          onChange={(e) => setManualCoordinate({...manualCoordinate, lng: e.target.value})}
                          className="border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>
                    
                    {manualCoordinateError && (
                      <p className="text-xs text-red-600">{manualCoordinateError}</p>
                    )}
                    
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={addManualWaypoint}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> 
                      Add to Route
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      <AlertCircle className="inline-block h-3 w-3 mr-1" />
                      Double-click on the map to add bins too
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-[500px]">
                {selectedArea && (
                  <BinMap
                    singleArea={selectedArea}
                    optimizedRoute={optimizedRoute?.route || []}
                    fitToRoute={!emptyRoute}
                    onBinSelect={setSelectedBin}
                    onBinDoubleClick={handleBinDoubleClick}
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
                  <span className="text-xs text-gray-500">Double-click on bins to include or exclude them</span>
                </div>
              </div>
            </div>
            
            {/* Route Bin Table */}
            {!emptyRoute && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <MoveVertical size={18} className="text-blue-600" /> 
                      Route Waypoints
                    </div>
                    {isAdjustmentMode && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                        Custom Order
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    Drag and drop to reorder. Remove unwanted waypoints.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="p-2">#</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Fill Level</th>
                          <th className="p-2">Last Collected</th>
                          <th className="p-2">Coordinates</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeBins.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-500">
                              No bins in route
                            </td>
                          </tr>
                        ) : (
                          routeBins.map((routeBin, index) => (
                            <tr 
                              key={`${routeBin.bin._id}-${index}`}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`border-b border-gray-100 hover:bg-gray-50 cursor-grab ${
                                draggedBinIndex === index ? 'opacity-50 bg-blue-50' : ''
                              }`}
                            >
                              <td className="p-2 font-medium">{index + 1}</td>
                              <td className="p-2">
                                {routeBin.bin._id.startsWith('waypoint') ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    Waypoint
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Bin
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div 
                                    className="h-2 w-12 rounded-full bg-gray-200 overflow-hidden mr-2"
                                  >
                                    <div 
                                      className={`h-full ${
                                        routeBin.bin.fillLevel >= 80 ? 'bg-red-500' :
                                        routeBin.bin.fillLevel >= 50 ? 'bg-amber-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${routeBin.bin.fillLevel}%` }}
                                    ></div>
                                  </div>
                                  <span>{routeBin.bin.fillLevel}%</span>
                                </div>
                              </td>
                              <td className="p-2">{formatDate(routeBin.bin.lastCollected)}</td>
                              <td className="p-2">
                                <span className="text-xs">
                                  {routeBin.bin.location.coordinates[1].toFixed(4)}, {routeBin.bin.location.coordinates[0].toFixed(4)}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleExcludeBin(routeBin.bin._id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Route Adjustment Controls - Only shown when a route exists */}
      {!emptyRoute && (
        <Card className={`shadow-md ${isAdjustmentMode ? 'border-2 border-amber-400' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Filter size={18} className="text-amber-600" /> 
                Route Adjustments
              </div>
              {isAdjustmentMode && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  Adjustment Mode
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {isAdjustmentMode 
                ? "You've modified the original route. Click Apply to update the route." 
                : "Use the table above to reorder stops or remove waypoints."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                {selectedBins.size > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <PlusCircle size={14} />
                    {selectedBins.size} waypoint{selectedBins.size !== 1 ? 's' : ''} added
                  </span>
                )}
                {excludedBins.size > 0 && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <MinusCircle size={14} />
                    {excludedBins.size} bin{excludedBins.size !== 1 ? 's' : ''} excluded
                  </span>
                )}
                {(routeBins.length > 0 && isAdjustmentMode) && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md flex items-center gap-1">
                    <MoveVertical size={14} />
                    Custom waypoint order
                  </span>
                )}
                {selectedBins.size === 0 && excludedBins.size === 0 && !isAdjustmentMode && (
                  <span className="text-gray-500 italic">No changes to the route</span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-md shadow-sm hover:bg-amber-600"
                  onClick={adjustRoute}
                  disabled={isLoadingRoute || (selectedBins.size === 0 && excludedBins.size === 0 && !isAdjustmentMode)}
                >
                  {isLoadingRoute ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Filter size={16} />
                  )}
                  Apply Changes
                </Button>
                
                {isAdjustmentMode && (
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-100"
                    onClick={resetAdjustments}
                  >
                    Reset to Original
                  </Button>
                )}
              </div>

              {isAdjustmentMode && (
                <div className="mt-2 p-2 bg-amber-50 rounded-md">
                  <p className="text-xs text-amber-700">
                    <AlertCircle size={14} className="inline mr-1" />
                    You can continue adjusting the route or save it as a schedule.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}