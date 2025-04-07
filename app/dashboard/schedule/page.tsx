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
  BinScheduleOptions, 
  OptimizedRoute 
} from "@/lib/api/routes";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Mock collectors data (will replace with API call)
const mockCollectors = [
  { id: "collector1", name: "John Smith", status: "active" },
  { id: "collector2", name: "Maria Garcia", status: "active" },
  { id: "collector3", name: "David Wong", status: "on-leave" },
];

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
}

export default function SchedulePage() {
  // State for areas and collectors
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [collectors, setCollectors] = useState<any[]>(mockCollectors);
  
  // State for route parameters
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [fillThreshold, setFillThreshold] = useState<number>(70);
  const [includeAllCritical, setIncludeAllCritical] = useState<boolean>(true);
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>("ALL");
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
  
  // State for route generation
  const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [error, setError] = useState<string | null>(null);
  
  // Load areas on component mount
  useEffect(() => {
    fetchAreas();
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
      // Prepare optimization options
      const options: BinScheduleOptions = {
        fillLevelThreshold: fillThreshold
      };
      
      // Include critical bins if the option is checked
      if (includeAllCritical) {
        const criticalBins = areas
          .find(area => area.areaID === selectedArea)
          ?.bins.filter(bin => bin.fillLevel >= 90)
          .map(bin => bin._id);
        
        if (criticalBins && criticalBins.length > 0) {
          options.includeIds = criticalBins;
        }
      }
      
      // Filter by waste types if any are selected
      if (wasteTypeFilter !== "ALL") {
        const selectedBins = areas
          .find(area => area.areaID === selectedArea)
          ?.bins.filter(bin => bin.wasteTypes === wasteTypeFilter)
          .map(bin => bin._id);
        
        if (selectedBins && selectedBins.length > 0) {
          options.includeIds = options.includeIds 
            ? [...new Set([...options.includeIds, ...selectedBins])]
            : selectedBins;
        }
      }
      
      // Call API to get optimized route
      const optimizedRoute = await getOptimizedRoute(selectedArea, options);
      
      // In development, we'll use mock data if API fails
      if (!optimizedRoute) {
        throw new Error("Failed to generate route");
      }
      
      // Get selected area details
      const selectedAreaData = areas.find(area => area.areaID === selectedArea);
      
      if (!selectedAreaData) {
        throw new Error("Selected area not found");
      }
      
      // Get selected collector
      const collector = selectedCollector 
        ? collectors.find(c => c.id === selectedCollector) 
        : collectors.find(c => c.status === 'active');
      
      if (!collector) {
        throw new Error("No active collector available");
      }
      
      // Parse the optimized route response
      const routeData: OptimizedRoute = optimizedRoute.route || optimizedRoute;
      const binSequence = optimizedRoute.binSequence || [];
      
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
            wasteTypes: "GENERAL",
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
      
      if (typeof routeData.distance === 'number') {
        distance = routeData.distance / 1000; // Convert to km
      } else if (typeof routeData.distance === 'string') {
        const match = routeData.distance.match(/(\d+(\.\d+)?)/);
        distance = match ? parseFloat(match[0]) : 0;
      }
      
      if (typeof routeData.duration === 'number') {
        duration = Math.round(routeData.duration / 60); // Convert to minutes
      } else if (typeof routeData.duration === 'string') {
        const match = routeData.duration.match(/(\d+(\.\d+)?)/);
        duration = match ? parseFloat(match[0]) : 0;
      }
      
      // Depot location (default coordinates or calculate from area)
      const calculateCenterCoordinates = (area: AreaWithBins): [number, number] => {
        if (area.startLocation && area.startLocation.coordinates) {
          return area.startLocation.coordinates;
        }
        
        // If no coordinates found, use default for Colombo
        return [79.861, 6.927];
      }
      
      const depotCoordinates = calculateCenterCoordinates(selectedAreaData);
      
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
          lat: depotCoordinates[1], 
          lng: depotCoordinates[0], 
          name: "Depot" 
        },
        endLocation: { 
          lat: depotCoordinates[1], 
          lng: depotCoordinates[0], 
          name: "Depot" 
        }
      };
      
      setCurrentRoute(route);
    } catch (err) {
      console.error('Error generating route:', err);
      setError('Failed to generate route. Please try again.');
      
      // For development, create a mock route
      createMockRoute();
    } finally {
      setIsGeneratingRoute(false);
    }
  };
  
  // Create a mock route for development
  const createMockRoute = () => {
    const selectedAreaData = areas.find(area => area.areaID === selectedArea);
    
    if (!selectedAreaData) {
      return;
    }
    
    // Filter bins based on fill level threshold
    const eligibleBins = selectedAreaData.bins.filter(
      bin => bin.fillLevel >= fillThreshold
    );
    
    // Get random depot coordinates or use area center
    const depotCoordinates = selectedAreaData.centerCoordinates || 
      [79.861, 6.927]; // Default to Colombo
    
    // Random distance and duration
    const distance = Math.round((eligibleBins.length * 0.5) * 10) / 10;
    const duration = Math.round(eligibleBins.length * 15);
    
    // Create mock route with eligible bins
    const mockRoute: RouteData = {
      name: scheduleName || `Route for ${selectedAreaData.areaName}`,
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      bins: eligibleBins.map((bin, index) => ({ 
        ...bin, 
        sequenceNumber: index + 1,
        estimatedArrival: new Date(Date.now() + (30 * 60 * 1000) * index).toISOString()
      })),
      collector: collectors.find(c => c.id === selectedCollector) || collectors[0],
      area: {
        id: selectedAreaData.areaID,
        name: selectedAreaData.areaName
      },
      totalDistance: distance,
      estimatedDuration: duration,
      startLocation: { 
        lat: depotCoordinates[1], 
        lng: depotCoordinates[0], 
        name: "Depot" 
      },
      endLocation: { 
        lat: depotCoordinates[1], 
        lng: depotCoordinates[0], 
        name: "Depot" 
      }
    };
    
    setCurrentRoute(mockRoute);
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
      // Prepare schedule data
      const scheduleData = {
        name: currentRoute.name,
        areaId: currentRoute.area.id,
        collectorId: currentRoute.collector.id,
        routeId: "temp-route-id", // This would be generated on the backend
        date: scheduleDate,
        startTime: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        status: "scheduled",
        binIds: currentRoute.bins.map(bin => bin._id)
      };
      
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

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Route Scheduling</h1>
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
        {/* Route Parameters Card */}
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
                    <CardDescription>
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
                {/* Route visualization and assignment combined in one container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Map and list tabs - takes 2/3 width on large screens */}
                  <div className="lg:col-span-2">
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
                            optimizedRoute={currentRoute.bins.map(bin => 
                              [bin.location.coordinates[0], bin.location.coordinates[1]] as [number, number]
                            )}
                            onBinSelect={handleBinSelect}
                            selectedBin={selectedBin}
                            style={{ height: "500px" }}
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
                                      {bin.wasteTypes.charAt(0) + bin.wasteTypes.slice(1).toLowerCase()}
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
                              >
                                <Plus size={16} className="mr-2" />
                                Add Bin to Route
                              </Button>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                
                  {/* Route Assignment Panel - takes 1/3 width on large screens */}
                  <div className="lg:col-span-1">
                    <div className="rounded-md border p-4">
                      <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                        <User size={18} />
                        Route Assignment
                      </h3>
                      <p className="text-sm text-muted-foreground mb-5">
                        Assign this route to a waste collector
                      </p>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label>Assign Collector</Label>
                          <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select collector" />
                            </SelectTrigger>
                            <SelectContent>
                              {collectors.filter(c => c.status === 'active').map((collector) => (
                                <SelectItem key={collector.id} value={collector.id}>
                                  {collector.name}
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
                        
                        <Button 
                          className="w-full mt-6" 
                          onClick={saveRoute}
                          disabled={!selectedCollector}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save & Dispatch Route
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
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
                <Button onClick={generateRoute}>
                  Generate Route
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}