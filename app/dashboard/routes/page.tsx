"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Route,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  RotateCcw,
  RefreshCcw,
  Check,
  Plus,
  Save,
  Edit,
  ChevronRight,
  ArrowRightLeft,
  Info,
  AlertCircle,
  Truck,
  User,
  List,
  MapIcon,
  XCircle,
  Loader2,
  MoveVertical,
  Settings,
} from "lucide-react";
import BinMap from "@/components/dashboard/bin-map";
import { 
  getAllAreasWithBins,
  AreaWithBins,
  Bin 
} from "@/lib/api/areas";
import { 
  getOptimizedRoute, 
  generateCustomRoute, 
  saveRouteSchedule,
  adjustExistingRoute, 
  OptimizedRoute,
  RouteParameters
} from "@/lib/api/routes";
import { getAllCollectors, getActiveCollectors } from "@/lib/api/collectors";
import { Collector } from "@/lib/types/collector";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface RouteData {
  id?: string;
  name: string;
  createdAt: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  bins: (Bin & { 
    sequenceNumber: number;
    estimatedArrival: string;
  })[];
  collector: any;
  area: {
    id: string;
    name: string;
  };
  totalDistance: number; 
  estimatedDuration: number;
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  routePolyline?: [number, number][]; // Add the actual route polyline from ORS
}

export default function SchedulePage() {
  // State for areas and collectors
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  
  // State for route parameters
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [fillThreshold, setFillThreshold] = useState<number>(70);
  const [includeAllCritical, setIncludeAllCritical] = useState<boolean>(true);
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>("GENERAL");
  const [selectedCollector, setSelectedCollector] = useState<string>("");
  const [scheduleName, setScheduleName] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleTime, setScheduleTime] = useState<string>(
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  );
  const [notes, setNotes] = useState<string>("");
  
  // State for route generation
  const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [error, setError] = useState<string | null>(null);
  
  // State for adding bins modal
  const [showAddBinModal, setShowAddBinModal] = useState<boolean>(false);
  const [availableBins, setAvailableBins] = useState<Bin[]>([]);
  const [selectedBinsToAdd, setSelectedBinsToAdd] = useState<string[]>([]);

  // State for UI flow
  const [showAssignment, setShowAssignment] = useState<boolean>(false);

  // Load areas and collectors on component mount
  useEffect(() => {
    fetchAreas();
    fetchCollectors();
  }, []);
  
  // Fetch all areas with bins
  const fetchAreas = async () => {
    try {
      setAreasLoading(true);
      const areasData = await getAllAreasWithBins();
      setAreas(areasData);
      
      // If there are areas, pre-select the first one
      if (areasData.length > 0) {
        setSelectedArea(areasData[0].areaID);
      }
    } catch (err) {
      console.error('Error fetching areas with bins:', err);
      setError('Failed to load areas data. Please try again later.');
    } finally {
      setAreasLoading(false);
    }
  };

  // Fetch all active collectors
  const fetchCollectors = async () => {
    try {
      const response = await getActiveCollectors();
      if (response && response.collectors) {
        setCollectors(response.collectors);
      } else {
        console.error('Invalid response format from getActiveCollectors');
        setError('Failed to load collectors data. Invalid response format.');
      }
    } catch (err) {
      console.error('Error fetching collectors:', err);
      setError('Failed to load collectors data. Please try again later.');
    }
  };
  
  // Auto-generate route name based on selected area and date
  useEffect(() => {
    if (selectedArea && scheduleDate) {
      const selectedAreaObj = areas.find(a => a.areaID === selectedArea);
      if (selectedAreaObj) {
        const date = new Date(scheduleDate);
        const dateFormat = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
        setScheduleName(`${dateFormat} - ${selectedAreaObj.areaName}`);
      }
    }
  }, [selectedArea, scheduleDate, areas]);
  
  // Handle bin selection
  const handleBinSelect = (bin: Bin | null) => {
    setSelectedBin(bin);
  };
  
  // Handle route generation
  const generateRoute = async () => {
    if (!selectedArea) {
      setError("Please select an area first");
      return;
    }
    
    setIsGeneratingRoute(true);
    setError(null);
    
    try {
      // Prepare route parameters using the new interface
      const parameters: RouteParameters = {
        fillLevelThreshold: fillThreshold,
        wasteType: wasteTypeFilter,
        includeCriticalBins: includeAllCritical
      };
      
      // Call API to get optimized route with new parameters
      const optimizedRoute = await getOptimizedRoute(selectedArea, parameters);
      
      if (!optimizedRoute) {
        throw new Error("Failed to generate route - no response from API");
      }
      
      console.log("Received route data:", optimizedRoute);
      
      // Get selected area details
      const selectedAreaData = areas.find(area => area.areaID === selectedArea);
      
      if (!selectedAreaData) {
        throw new Error("Selected area not found");
      }
      
      // Get selected collector
      const collector = selectedCollector 
        ? collectors.find(c => c._id === selectedCollector) 
        : collectors.find(c => c.status === 'active');
      
      if (!collector) {
        throw new Error("No active collector available");
      }
      
      // Parse the optimized route response
      const routeData: OptimizedRoute = optimizedRoute.route || optimizedRoute;
      const binSequence = optimizedRoute.binSequence || [];
      
      // Store the actual route polyline coordinates
      const routePolyline = optimizedRoute.route && optimizedRoute.route.geometry ? 
        optimizedRoute.route.geometry.coordinates.map((coord: [number, number]) => [coord[0], coord[1]] as [number, number]) :
        routeData.route;
      
      // Create bins sequence with extended data
      const selectedBins = binSequence.map((binId: string, index: number) => {
        const bin = selectedAreaData.bins.find(b => b._id === binId);
        
        // If bin not found, create a placeholder
        if (!bin) {
          return {
            _id: binId,
            location: {
              type: "Point",
              coordinates: [0, 0] // default coordinates
            },
            fillLevel: 0,
            lastCollected: new Date().toISOString(),
            address: "Unknown",
            wasteType: "GENERAL",
            sequenceNumber: index + 1,
            estimatedArrival: new Date(Date.now() + (30 * 60 * 1000) * index).toISOString()
          };
        }
        
        // Add sequence number and estimated arrival
        return {
          ...bin,
          sequenceNumber: index + 1,
          estimatedArrival: new Date(Date.now() + (30 * 60 * 1000) * index).toISOString()
        };
      });
      
      // Extract distance and duration from route data
      let distance = 0;
      let duration = 0;
      
      // Handle distance - already in km from our backend calculation
      if (typeof routeData.distance === 'number') {
        distance = routeData.distance;
      } else if (typeof routeData.distance === 'string') {
        // For string format (fallback)
        const match = routeData.distance.match(/(\d+(\.\d+)?)/);
        distance = match ? parseFloat(match[0]) : 0;
      }
      
      // Handle duration - already in minutes from our backend calculation
      if (typeof routeData.duration === 'number') {
        duration = routeData.duration;
      } else if (typeof routeData.duration === 'string') {
        // For string format (fallback)
        const match = routeData.duration.match(/(\d+(\.\d+)?)/);
        duration = match ? parseFloat(match[0]) : 0;
      }
      
      // Apply minimum values to prevent 0 km or 0 minutes display
      distance = Math.max(0.1, distance);
      duration = Math.max(1, duration);
      
      console.log("Parsed route metrics:", { distance, duration });
      
      // Use area's defined start and end locations directly
      const startCoordinates = selectedAreaData.startLocation ? 
        selectedAreaData.startLocation.coordinates : [79.861, 6.927]; // Default to Colombo if missing
      
      const endCoordinates = selectedAreaData.endLocation ? 
        selectedAreaData.endLocation.coordinates : startCoordinates; // Default to start location if missing
      
      // Create route object
      const route: RouteData = {
        name: scheduleName,
        createdAt: new Date().toISOString(),
        status: 'scheduled',
        bins: selectedBins,
        collector: collector,
        area: {
          id: selectedAreaData.areaID,
          name: selectedAreaData.areaName
        },
        totalDistance: distance,
        estimatedDuration: duration,
        startLocation: { 
          lat: startCoordinates[1], 
          lng: startCoordinates[0], 
          name: "Depot" 
        },
        endLocation: { 
          lat: endCoordinates[1], 
          lng: endCoordinates[0], 
          name: "Disposal Facility" // Better name for end location
        },
        routePolyline: routePolyline // Store the actual route polyline
      };
      
      setCurrentRoute(route);
      setShowAssignment(true); // Show assignment card after route is generated
    } catch (err) {
      console.error('Error generating route:', err);
      setError('Failed to generate route. Please check console for details.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };
  
  // Handle bin reordering in edit mode
  const handleBinReorder = (sourceIndex: number, destinationIndex: number) => {
    if (!currentRoute || !editMode) return;
    
    const newBins = [...currentRoute.bins];
    const [removed] = newBins.splice(sourceIndex, 1);
    newBins.splice(destinationIndex, 0, removed);
    
    // Recalculate sequence numbers
    const reorderedBins = newBins.map((bin, index) => ({
      ...bin,
      sequenceNumber: index + 1
    }));
    
    setCurrentRoute({
      ...currentRoute,
      bins: reorderedBins
    });
  };
  
  // Handle removal of a bin from the route
  const handleRemoveBin = (binId: string) => {
    if (!currentRoute || !editMode) return;
    
    const newBins = currentRoute.bins.filter(bin => bin._id !== binId);
    
    // Recalculate sequence numbers
    const resequencedBins = newBins.map((bin, index) => ({
      ...bin,
      sequenceNumber: index + 1
    }));
    
    setCurrentRoute({
      ...currentRoute,
      bins: resequencedBins
    });
  };
  
  // Handle route save
  const saveRoute = async () => {
    if (!currentRoute) return;
    
    if (!selectedCollector) {
      setError("Please select a collector for this route");
      return;
    }
    
    setIsGeneratingRoute(true);
    setError(null);
    
    try {
      // Prepare schedule data matching the createSchedule endpoint structure
      const scheduleData = {
        name: currentRoute.name,
        areaId: currentRoute.area.id,
        collectorId: selectedCollector, // Use the selected collector ID
        date: scheduleDate,
        startTime: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        endTime: new Date(
          new Date(`${scheduleDate}T${scheduleTime}`).getTime() + currentRoute.estimatedDuration * 60000
        ).toISOString(),
        status: "scheduled",
        notes: notes,
        // Route data properties that match the backend Schedule model
        route: currentRoute.routePolyline, // Send the coordinates as 'route'
        distance: currentRoute.totalDistance, // Send distance value directly 
        duration: currentRoute.estimatedDuration, // Send duration value directly
        binSequence: currentRoute.bins.map(bin => bin._id) // Send bin IDs in sequence
      };
      
      console.log("Saving route with data:", scheduleData);
      
      // Save the route
      await saveRouteSchedule(scheduleData);
      
      // Success message
      alert("Route scheduled successfully!");
      setEditMode(false);
      
      // Reset form after successful save
      setCurrentRoute(null);
      setSelectedBin(null);
    } catch (err) {
      console.error('Error saving route:', err);
      setError('Failed to save route. Please try again.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };
  
  // Handle going back to route parameters
  const handleGoBack = () => {
    setShowAssignment(false);
    setCurrentRoute(null);
    setSelectedBin(null);
    setEditMode(false);
  };

  // Format route duration into human-readable time
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Get fill level color class
  const getFillLevelColorClass = (level: number) => {
    if (level >= 90) return "bg-red-500";
    if (level >= 70) return "bg-amber-500";
    if (level >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  // Function to retrieve available bins when the add bin modal is opened
  const getAvailableBins = () => {
    if (!selectedArea || !currentRoute) return;
    
    // Get the area data
    const areaData = areas.find(area => area.areaID === selectedArea);
    if (!areaData) return;
    
    // Get IDs of bins already in the route
    const routeBinIds = new Set(currentRoute.bins.map(bin => bin._id));
    
    // Filter area bins to find ones not already in the route
    const binsNotInRoute = areaData.bins.filter(bin => !routeBinIds.has(bin._id));
    
    setAvailableBins(binsNotInRoute);
    setSelectedBinsToAdd([]);
    setShowAddBinModal(true);
  };
  
  // Handle adding selected bins to the route
  const handleAddBinsToRoute = () => {
    if (!currentRoute || selectedBinsToAdd.length === 0) return;
    
    // Get the area data
    const areaData = areas.find(area => area.areaID === selectedArea);
    if (!areaData) return;
    
    // Find the selected bins from the area
    const binsToAdd = selectedBinsToAdd.map(binId => {
      const bin = areaData.bins.find(b => b._id === binId);
      return {
        ...bin!,
        sequenceNumber: currentRoute.bins.length + 1 + selectedBinsToAdd.indexOf(binId),
        estimatedArrival: new Date(
          new Date(currentRoute.bins[currentRoute.bins.length - 1]?.estimatedArrival || Date.now()).getTime() + 
          (30 * 60 * 1000) * (1 + selectedBinsToAdd.indexOf(binId))
        ).toISOString()
      };
    });
    
    // Update the route with the new bins
    const updatedBins = [...currentRoute.bins, ...binsToAdd];
    
    setCurrentRoute({
      ...currentRoute,
      bins: updatedBins
    });
    
    setShowAddBinModal(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
        <div className="flex items-center gap-3">
          {currentRoute && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingRoute}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Editing
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Route
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingRoute || !editMode}
                onClick={saveRoute}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Route
              </Button>
            </>
          )}
          {!showAssignment && (
            <Button
              size="sm"
              onClick={generateRoute}
              disabled={isGeneratingRoute}
            >
              {isGeneratingRoute ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Generate Route
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <XCircle className="h-4 w-4" />
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Route Parameters Card - Only show when not in assignment mode */}
        {!showAssignment && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={18} />
                Route Parameters
              </CardTitle>
              <CardDescription>
                Configure settings for route generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Route Name</Label>
                <Input
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Enter a name for this route"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Collection Area</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.areaID} value={area.areaID}>
                        {area.areaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Fill Level Threshold</Label>
                  <span className="text-sm font-medium">{fillThreshold}%</span>
                </div>
                <Slider
                  value={[fillThreshold]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setFillThreshold(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Only bins with fill level at or above this threshold will be included
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="critical-bins"
                  checked={includeAllCritical}
                  onCheckedChange={(checked) => 
                    setIncludeAllCritical(checked === true)
                  }
                />
                <Label htmlFor="critical-bins">
                  Include all critical bins (≥ 90%) regardless of other filters
                </Label>
              </div>
              
              <div className="space-y-3">
                <Label>Waste Types</Label>
                <RadioGroup
                  value={wasteTypeFilter}
                  defaultValue="GENERAL"
                  onValueChange={setWasteTypeFilter}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="GENERAL" id="waste-type-general" />
                    <Label htmlFor="waste-type-general">General</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ORGANIC" id="waste-type-organic" />
                    <Label htmlFor="waste-type-organic">Organic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="RECYCLE" id="waste-type-recycle" />
                    <Label htmlFor="waste-type-recycle">Recycle</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HAZARDOUS" id="waste-type-hazardous" />
                    <Label htmlFor="waste-type-hazardous">Hazardous</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Select a waste type to filter bins
                </p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={generateRoute} 
                disabled={isGeneratingRoute}
              >
                {isGeneratingRoute ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Route className="mr-2 h-4 w-4" />
                )}
                Generate Optimized Route
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Route Assignment Card - Only show when in assignment mode */}
        {showAssignment && currentRoute && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} />
                Route Assignment
              </CardTitle>
              <CardDescription>
                Assign this route to a waste collector
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Assign Collector</Label>
                <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collector" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectors.filter(c => c.status === 'active').map((collector) => (
                      <SelectItem key={collector._id} value={collector._id}>
                        {collector.firstName ? `${collector.firstName} ${collector.lastName || ''}` : collector.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Schedule Date</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Notes (Optional)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Add any relevant notes for this route"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Bins:</span>
                  <span className="font-medium">{currentRoute.bins.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Route Distance:</span>
                  <span className="font-medium">{currentRoute.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Duration:</span>
                  <span className="font-medium">{formatDuration(currentRoute.estimatedDuration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Fill Level:</span>
                  <span className="font-medium">
                    {Math.round(
                      currentRoute.bins.reduce((sum, bin) => sum + bin.fillLevel, 0) / 
                      currentRoute.bins.length
                    )}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 pt-3">
                <Button 
                  className="w-full" 
                  onClick={saveRoute}
                  disabled={!selectedCollector || isGeneratingRoute}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save & Dispatch Route
                </Button>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleGoBack}
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  Go Back to Parameters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Display Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Loading state */}
          {isGeneratingRoute && !currentRoute && (
            <Card className="w-full h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Generating optimal route...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            </Card>
          )}

          {/* Route exists */}
          {currentRoute && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck size={18} />
                      {currentRoute.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {currentRoute.area.name} • {currentRoute.bins.length} stops • 
                      {formatDuration(currentRoute.estimatedDuration)} • 
                      {currentRoute.totalDistance.toFixed(1)} km
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="mb-1">
                      {currentRoute.status === 'scheduled' && 'Scheduled'}
                      {currentRoute.status === 'in-progress' && 'In Progress'}
                      {currentRoute.status === 'completed' && 'Completed'}
                      {currentRoute.status === 'cancelled' && 'Cancelled'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created {formatDate(currentRoute.createdAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <MapIcon size={16} />
                      Map View
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List size={16} />
                      Sequence View
                    </TabsTrigger>
                  </TabsList>

                  {/* Map View Tab */}
                  <TabsContent value="map" className="m-0">
                    <div className="h-[500px] rounded-md overflow-hidden">
                      <BinMap
                        bins={currentRoute.bins}
                        optimizedRoute={currentRoute.routePolyline || currentRoute.bins.map(bin => 
                          [bin.location.coordinates[0], bin.location.coordinates[1]] as [number, number]
                        )}
                        onBinSelect={handleBinSelect}
                        selectedBin={selectedBin}
                        style={{ height: "500px" }}
                        singleArea={areas.find(area => area.areaID === selectedArea)}
                        fitToRoute={true}
                      />
                    </div>
                  </TabsContent>

                  {/* List View Tab */}
                  <TabsContent value="list" className="m-0">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Route Sequence</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {editMode 
                          ? "Drag and drop to reorder bins in the route" 
                          : "Collection sequence with estimated arrival times"}
                      </p>
                      <div className="space-y-2">
                        {/* Start Location */}
                        <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-md">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">Start: {currentRoute.startLocation.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Bin Sequence */}
                        {currentRoute.bins.map((bin, index) => (
                          <div 
                            key={bin._id}
                            className={cn(
                              "flex items-center p-3 border rounded-md transition-all",
                              editMode ? "cursor-move hover:bg-gray-50" : "",
                              selectedBin && selectedBin._id === bin._id ? "border-blue-300 bg-blue-50" : "border-gray-200"
                            )}
                            onClick={() => handleBinSelect(bin)}
                            draggable={editMode}
                            onDragStart={(e) => {
                              if (editMode) {
                                e.dataTransfer.setData('text/plain', String(index));
                              }
                            }}
                            onDragOver={(e) => {
                              if (editMode) {
                                e.preventDefault();
                              }
                            }}
                            onDrop={(e) => {
                              if (editMode) {
                                e.preventDefault();
                                const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                handleBinReorder(sourceIndex, index);
                              }
                            }}
                          >
                            {editMode && (
                              <MoveVertical size={16} className="text-gray-400 mr-2" />
                            )}
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full mr-3">
                              {bin.sequenceNumber}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{bin._id}</p>
                                <Badge variant="outline" className="ml-2">
                                  {bin.wasteType.charAt(0) + bin.wasteType.slice(1).toLowerCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{bin.address}</p>
                              <div className="flex items-center mt-1">
                                <div 
                                  className={`w-2 h-2 rounded-full mr-1 ${getFillLevelColorClass(bin.fillLevel)}`} 
                                />
                                <span className="text-xs">{bin.fillLevel}% Full</span>
                                <div className="mx-2 text-gray-300">|</div>
                                <Clock size={12} className="text-gray-500 mr-1" />
                                <span className="text-xs">
                                  {new Date(bin.estimatedArrival).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            {editMode && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBin(bin._id);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        ))}

                        {/* End Location */}
                        <div className="flex items-center p-3 border border-blue-200 bg-blue-50 rounded-md">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">End: {currentRoute.endLocation.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Estimated arrival: {new Date(
                                new Date(`${scheduleDate}T${scheduleTime}`).getTime() + currentRoute.estimatedDuration * 60000
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Add bin button in edit mode */}
                        {editMode && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-4 border-dashed"
                            onClick={getAvailableBins}
                          >
                            <Plus size={16} className="mr-2" />
                            Add Bin to Route
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              {editMode && (
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Changes
                  </Button>
                  <Button 
                    onClick={saveRoute}
                    disabled={!selectedCollector}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Route
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}

          {/* No route yet */}
          {!isGeneratingRoute && !currentRoute && (
            <Card className="w-full h-[600px] flex items-center justify-center">
              <div className="text-center max-w-md p-6">
                <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Route</h3>
                <p className="text-muted-foreground mb-6">
                  Configure your parameters and generate a new collection route
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Bin Modal */}
      {showAddBinModal && currentRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle>Add Bins to Route</CardTitle>
              <CardDescription>
                Select bins to add to the current route
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              {availableBins.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No more bins available to add from this area.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableBins.map(bin => (
                    <div 
                      key={bin._id}
                      className={cn(
                        "flex items-center p-3 border rounded-md hover:bg-gray-50",
                        selectedBinsToAdd.includes(bin._id) ? "border-blue-300 bg-blue-50" : "border-gray-200"
                      )}
                      onClick={() => {
                        if (selectedBinsToAdd.includes(bin._id)) {
                          setSelectedBinsToAdd(selectedBinsToAdd.filter(id => id !== bin._id));
                        } else {
                          setSelectedBinsToAdd([...selectedBinsToAdd, bin._id]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-center mr-3">
                        <Checkbox 
                          checked={selectedBinsToAdd.includes(bin._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBinsToAdd([...selectedBinsToAdd, bin._id]);
                            } else {
                              setSelectedBinsToAdd(selectedBinsToAdd.filter(id => id !== bin._id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{bin._id}</p>
                          <Badge variant="outline" className="ml-2">
                            {bin.wasteType.charAt(0) + bin.wasteType.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{bin.address}</p>
                        <div className="flex items-center mt-1">
                          <div 
                            className={`w-2 h-2 rounded-full mr-1 ${getFillLevelColorClass(bin.fillLevel)}`} 
                          />
                          <span className="text-xs">{bin.fillLevel}% Full</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAddBinModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddBinsToRoute}
                disabled={selectedBinsToAdd.length === 0}
              >
                Add {selectedBinsToAdd.length} {selectedBinsToAdd.length === 1 ? 'Bin' : 'Bins'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}