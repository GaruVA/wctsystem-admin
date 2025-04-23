"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    ArrowLeft,
} from "lucide-react";
import BinMap from "@/components/dashboard/bin-map";
import RouteMap from "@/components/dashboard/route-map";
import {
    getAllAreasWithBins,
    AreaWithBins,
    Bin
} from "@/lib/api/areas";
import {
    getOptimizedRoute,
    saveRouteSchedule,
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

interface RouteCreationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onRouteCreated?: () => void; // Callback for when a route is successfully created
    selectedDate?: Date; // Optional: pre-selected date
}

export default function RouteCreationDialog({
    isOpen,
    onClose,
    onRouteCreated,
    selectedDate,
}: RouteCreationDialogProps) {
    // State for wizard steps
    const [step, setStep] = useState<number>(1); // 1: Route Parameters, 2: Map View, 3: Bin Sequence, 4: Route Assignment

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
        selectedDate
            ? selectedDate.toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
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

    // Reset the state when the dialog is opened/closed
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setEditMode(false);
            setSelectedBin(null);

            // Set default schedule date from props if provided
            if (selectedDate) {
                setScheduleDate(selectedDate.toISOString().split("T")[0]);
            }

            // Don't reset route data immediately, as we want to maintain it if the user goes back
            // But we do want to reset it when the dialog is closed
        } else {
            // Reset state only after the dialog animation completes
            const timeout = setTimeout(() => {
                setCurrentRoute(null);
                setError(null);
            }, 300);

            return () => clearTimeout(timeout);
        }
    }, [isOpen, selectedDate]);

    // Load areas and collectors on component mount
    useEffect(() => {
        if (isOpen) {
            fetchAreas();
            fetchCollectors();
        }
    }, [isOpen]);

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
            // Prepare route parameters
            const parameters: RouteParameters = {
                fillLevelThreshold: fillThreshold,
                wasteType: wasteTypeFilter,
                includeCriticalBins: includeAllCritical
            };

            // Call API to get optimized route
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
                collector: selectedCollector ? collectors.find(c => c._id === selectedCollector) : null,
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
                    name: "Disposal Facility"
                },
                routePolyline: routePolyline // Store the actual route polyline
            };

            setCurrentRoute(route);
            // Move to next step after route generation
            setStep(2);
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
            setEditMode(false);

            // Reset form after successful save
            setCurrentRoute(null);
            setSelectedBin(null);

            // Call the onRouteCreated callback if provided
            if (onRouteCreated) {
                onRouteCreated();
            }

            // Close the dialog
            onClose();
        } catch (err) {
            console.error('Error saving route:', err);
            setError('Failed to save route. Please try again.');
        } finally {
            setIsGeneratingRoute(false);
        }
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

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderRouteParametersStep();
            case 2:
                return renderMapViewStep();
            case 3:
                return renderBinSequenceStep();
            case 4:
                return renderRouteAssignmentStep();
            default:
                return null;
        }
    };

    // Step 1: Route Parameters
    const renderRouteParametersStep = () => {
        return (
            <div className="space-y-6">
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
            </div>
        );
    };

    // Step 2: Route Map
    const renderMapViewStep = () => {
        if (!currentRoute) {
            return (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium">No route generated yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please go back and generate a route first
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="h-[500px] rounded-md overflow-hidden">
                    <RouteMap
                        routeBins={currentRoute.bins}
                        routePolyline={currentRoute.routePolyline}
                        area={areas.find(area => area.areaID === selectedArea)}
                        onBinSelect={handleBinSelect}
                        selectedBin={selectedBin}
                        style={{ height: "500px" }}
                        showSequenceNumbers={true}
                    />
                </div>
            </div>
        );
    };

    // Step 3: Bin Sequence
    const renderBinSequenceStep = () => {
        if (!currentRoute) {
            return (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium">No route generated yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please go back and generate a route first
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {/* Start Location */}
                    <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-md">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3">
                            <MapPin size={16} />
                        </div>
                        <div className="flex-grow">
                            <p className="font-medium">Start: {currentRoute.startLocation.name}</p>
                            <div className="flex items-center mt-1">
                                <Clock size={12} className="text-gray-500 mr-1" />
                                <span className="text-xs">
                                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                                </span>
                            </div>
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
                            <div className="flex items-center mt-1">
                                <Clock size={12} className="text-gray-500 mr-1" />
                                <span className="text-xs">
                                    {new Date(
                                        new Date(`${scheduleDate}T${scheduleTime}`).getTime() + currentRoute.estimatedDuration * 60000
                                    ).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
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
        );
    };

    // Step 4: Route Assignment
    const renderRouteAssignmentStep = () => {
        if (!currentRoute) {
            return (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium">No route generated yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please go back and generate a route first
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="space-y-3">
                    <Label>Assign Collector</Label>
                    <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select collector" />
                        </SelectTrigger>
                        <SelectContent>
                            {collectors
                                .filter(c =>
                                    // Only show collectors who are:
                                    // 1. Active AND
                                    // 2. Assigned to the current area
                                    c.status === 'active' &&
                                    (c.area?._id === currentRoute.area.id || (typeof c.area === 'string' && c.area === currentRoute.area.id))
                                )
                                .map((collector) => (
                                    <SelectItem
                                        key={collector._id}
                                        value={collector._id}
                                    >
                                        {collector.firstName ? `${collector.firstName} ${collector.lastName || ''}` : collector.username}
                                    </SelectItem>
                                ))}
                            {collectors.filter(c =>
                                c.status === 'active' &&
                                (c.area?._id === currentRoute.area.id || (typeof c.area === 'string' && c.area === currentRoute.area.id))
                            ).length === 0 && (
                                    <SelectItem value="no-collectors" disabled>
                                        No available collectors for this area
                                    </SelectItem>
                                )}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Only showing active collectors assigned to this area
                    </p>
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
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] p-6 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 && "Route Parameters"}
                        {step === 2 && "Route Map View"}
                        {step === 3 && "Collection Sequence"}
                        {step === 4 && "Assign and Schedule"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Configure parameters to generate an optimized collection route"}
                        {step === 2 && "Review the generated route on the map"}
                        {step === 3 && "Review the collection sequence with estimated arrival times"}
                        {step === 4 && "Assign a collector and schedule the route"}
                    </DialogDescription>
                </DialogHeader>

                {/* Error display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                            <XCircle className="h-4 w-4" />
                        </span>
                    </div>
                )}

                {/* Main content area */}
                <div className="flex-1 overflow-auto">
                    {isGeneratingRoute && step === 1 ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-lg font-medium">Generating optimal route...</p>
                                <p className="text-sm text-muted-foreground">
                                    This may take a few moments
                                </p>
                            </div>
                        </div>
                    ) : (
                        renderStepContent()
                    )}
                </div>

                {/* Footer buttons */}
                <DialogFooter className="mt-6 flex justify-between">
                    {step > 1 ? (
                        <Button
                            variant="outline"
                            onClick={() => setStep(step - 1)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    )}

                    {step < 4 ? (
                        <Button
                            onClick={() => {
                                if (step === 1) {
                                    generateRoute();
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                            disabled={isGeneratingRoute || (step === 1 && !selectedArea)}
                        >
                            {step === 1 && (
                                <>
                                    {isGeneratingRoute ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Route
                                </>
                            )}
                            {step === 2 && (
                                <>
                                    Continue
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                            {step === 3 && (
                                <>
                                    Continue
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={saveRoute}
                            disabled={!selectedCollector || isGeneratingRoute}
                        >
                            {isGeneratingRoute ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save & Schedule Route
                        </Button>
                    )}
                </DialogFooter>

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
            </DialogContent>
        </Dialog>
    );
}