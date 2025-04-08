"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  MapPin,
  Plus,
  Search,
  Truck,
  User,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import BinMap from "@/components/dashboard/bin-map";
import { getAllAreasWithBins } from "@/lib/api/areas"; 
import { getAllSchedules, Schedule } from "@/lib/api/schedules";

// Schedule details dialog component
const ScheduleDetailsDialog = ({ 
  isOpen, 
  onClose, 
  schedule 
}: { 
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
}) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen || !schedule) return null;

  // Safely access potentially undefined properties
  const scheduleName = schedule.name || 'Unnamed Schedule';
  const scheduleDate = schedule.date || 'No date specified';
  const areaName = schedule.area?.name || 'Unknown area';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{scheduleName}</h2>
              <p className="text-gray-500">
                {scheduleDate} • {areaName}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge 
                className={cn(
                  "px-2 py-1",
                  schedule.status === "scheduled" && "bg-blue-100 text-blue-800",
                  schedule.status === "in-progress" && "bg-amber-100 text-amber-800",
                  schedule.status === "completed" && "bg-green-100 text-green-800",
                )}
              >
                {(schedule.status || 'Unknown').charAt(0).toUpperCase() + (schedule.status || 'Unknown').slice(1)}
              </Badge>
              <button
                className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-100"
                onClick={onClose}
              >
                &times;
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-grow overflow-auto">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="route">Route Map</TabsTrigger>
              <TabsTrigger value="bins">Collection Bins</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Schedule Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span>{scheduleDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Start Time:</span>
                      <span>{schedule.startTime ? new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">End Time:</span>
                      <span>{schedule.endTime ? new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span>{schedule.duration ? `${schedule.duration} minutes` : 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Distance:</span>
                      <span>{typeof schedule.distance === 'number' ? schedule.distance.toFixed(2) : (schedule.distance || 'Not specified')} km</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Assignment</h3>
                  <div className="flex items-center p-3 border rounded-md mb-4">
                    <User className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium">{schedule.collector?.firstName ? `${schedule.collector.firstName} ${schedule.collector.lastName || ''}` : 'Unassigned'}</p>
                      <p className="text-xs text-gray-500">{schedule.collector?.phone || 'No phone number'}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-medium mb-2">Area</h3>
                  <div className="flex items-center p-3 border rounded-md">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium">{areaName}</p>
                      <p className="text-xs text-gray-500">{(schedule.binSequence?.length || 0)} bins to collect</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {schedule.notes && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="p-3 border rounded-md bg-gray-50">
                    {schedule.notes}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="route" className="p-4">
              <div className="h-[400px] border rounded-md overflow-hidden">
                {schedule.route && schedule.route.length > 0 ? (
                  <BinMap 
                    optimizedRoute={schedule.route}
                    bins={[]} // We would need to fetch bin details
                    style={{ height: "400px" }}
                    fitToRoute={true}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No route data available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="bins" className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Collection Sequence</h3>
                  <span className="text-sm text-gray-500">{schedule.binSequence?.length || 0} bins total</span>
                </div>
                
                {(schedule.binSequence || []).length > 0 ? (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {(schedule.binSequence || []).map((binId: string, index: number) => (
                      <div key={binId} className="flex items-center p-3 border rounded-md">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full mr-3">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">Bin ID: {binId}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">
                              Estimated arrival: {
                                schedule.startTime ? 
                                new Date(
                                  new Date(schedule.startTime).getTime() + (index * 10 * 60000)
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Not available'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center border rounded-md">
                    <p className="text-gray-500">No bin sequence data available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function SchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [areas, setAreas] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Format date for display
  const formattedDate = format(selectedDate, "MMMM d, yyyy");
  
  // Calculate day of week
  const dayOfWeek = format(selectedDate, "EEEE");

  // Fetch areas and schedules when date changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch areas (still needed for displaying area names)
        const areasData = await getAllAreasWithBins();
        setAreas(areasData);
        
        // Format date for API query (YYYY-MM-DD)
        const dateString = format(selectedDate, "yyyy-MM-dd");
        console.log('Fetching schedules for date:', dateString);
        
        // Fetch schedules with date parameter
        const schedulesData = await getAllSchedules({ date: dateString });
        console.log('Schedules received:', schedulesData);
        
        // Process schedules to ensure area and collector info is available
        const processedSchedules = schedulesData.map((schedule: Schedule) => {
          // If we don't have an area object but have an areaId
          if (!schedule.area && schedule.areaId) {
            const matchingArea = areasData.find((area: any) => area.areaID === schedule.areaId);
            if (matchingArea) {
              schedule.area = {
                _id: matchingArea.areaID,
                name: matchingArea.areaName
              };
            }
          }
          return schedule;
        });
        
        setSchedules(processedSchedules);
        setFilteredSchedules(processedSchedules);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
  };

  // Handle view details
  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsOpen(true);
  };

  // Handle export
  const handleExport = () => {
    // Implementation for exporting schedules
    alert("Export functionality would be implemented here");
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            View and manage waste collection schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push("/dashboard/routes")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle>{dayOfWeek}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <Input 
                  type="date" 
                  value={format(selectedDate, "yyyy-MM-dd")} 
                  onChange={handleDateChange}
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSchedules.length > 0 ? (
            <div className="space-y-4">
              {filteredSchedules.map((schedule, index) => (
                <div
                  key={schedule._id || `schedule-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Truck className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{schedule.name || 'Unnamed Schedule'}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {schedule.startTime ? new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Start time not set'} - 
                          {schedule.endTime ? new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End time not set'}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            schedule.status === "scheduled" && "border-blue-200 bg-blue-50 text-blue-700", 
                            schedule.status === "in-progress" && "border-amber-200 bg-amber-50 text-amber-700",
                            schedule.status === "completed" && "border-green-200 bg-green-50 text-green-700",
                          )}
                        >
                          {schedule.status ? (schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)) : 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {schedule.area?.name || "Unknown area"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {(schedule.collector && schedule.collector.firstName) 
                            ? `${schedule.collector.firstName} ${schedule.collector.lastName || ''}` 
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(schedule)}
                    >
                      View Details
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-4">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium">No schedules found</h3>
              <p className="text-sm text-gray-500 mt-1">
                No collection schedules for {formattedDate}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Schedule details dialog */}
      <ScheduleDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        schedule={selectedSchedule}
      />
    </div>
  );
}