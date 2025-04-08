"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar as CalendarIcon,
  Check,
  Download,
  Filter,
  MapPin,
  Plus,
  Search,
  Truck,
  User,
  ArrowRight,
  X,
  Edit,
  Trash2,
  Clock,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import BinMap from "@/components/dashboard/bin-map";
import { getAllAreasWithBins, AreaWithBins } from "@/lib/api/areas"; 
import { getAllSchedules, getScheduleById, deleteSchedule, updateScheduleStatus, Schedule } from "@/lib/api/schedules";
import { getActiveCollectors, Collector } from "@/lib/api/collectors";

// Schedule Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  
  return (
    <Badge 
      className={cn(
        "px-2 py-1",
        status === "scheduled" && "bg-blue-100 text-blue-800 hover:bg-blue-200",
        status === "in-progress" && "bg-amber-100 text-amber-800 hover:bg-amber-200",
        status === "completed" && "bg-green-100 text-green-800 hover:bg-green-200",
        status === "cancelled" && "bg-red-100 text-red-800 hover:bg-red-200",
      )}
    >
      {statusText}
    </Badge>
  );
};

// Schedule details dialog component
const ScheduleDetailsDialog = ({ 
  isOpen, 
  onClose, 
  schedule,
  onStatusChange,
  onEdit,
  onDelete,
}: { 
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onStatusChange: (id: string, newStatus: string) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailedSchedule, setDetailedSchedule] = useState<Schedule | null>(schedule);
  const [changeStatusLoading, setChangeStatusLoading] = useState(false);

  useEffect(() => {
    if (schedule?._id && isOpen) {
      setIsLoading(true);
      getScheduleById(schedule._id)
        .then(data => {
          setDetailedSchedule(data);
        })
        .catch(err => console.error("Error fetching schedule details:", err))
        .finally(() => setIsLoading(false));
    } else {
      setDetailedSchedule(schedule);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !detailedSchedule) return null;

  // Safely access potentially undefined properties
  const scheduleName = detailedSchedule.name || 'Unnamed Schedule';
  const scheduleDate = detailedSchedule.date 
    ? format(new Date(detailedSchedule.date), "MMMM d, yyyy")
    : 'No date specified';
  const areaName = detailedSchedule.area?.name || 'Unknown area';

  // Format duration and distance
  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!detailedSchedule._id) return;
    
    setChangeStatusLoading(true);
    try {
      await onStatusChange(detailedSchedule._id, newStatus);
      // Update the local state
      setDetailedSchedule({
        ...detailedSchedule,
        status: newStatus as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
      });
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setChangeStatusLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = () => {
    if (detailedSchedule._id) {
      onDelete(detailedSchedule._id);
      setConfirmDelete(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl">{scheduleName}</DialogTitle>
                <DialogDescription className="mt-1">
                  {scheduleDate} • {areaName}
                </DialogDescription>
              </div>
              <StatusBadge status={detailedSchedule.status} />
            </div>
          </DialogHeader>
          
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="route">Route Map</TabsTrigger>
                  <TabsTrigger value="bins">Collection Bins</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-sm text-slate-500 uppercase">Schedule Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Date:</span>
                            <span className="font-medium">{scheduleDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Start Time:</span>
                            <span className="font-medium">
                              {detailedSchedule.startTime 
                                ? format(new Date(detailedSchedule.startTime), "h:mm a") 
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">End Time:</span>
                            <span className="font-medium">
                              {detailedSchedule.endTime 
                                ? format(new Date(detailedSchedule.endTime), "h:mm a") 
                                : 'Not set'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Duration:</span>
                            <span className="font-medium">
                              {formatDuration(detailedSchedule.duration || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Distance:</span>
                            <span className="font-medium">
                              {typeof detailedSchedule.distance === 'number' 
                                ? `${detailedSchedule.distance.toFixed(1)} km` 
                                : 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Bins to Collect:</span>
                            <span className="font-medium">
                              {(detailedSchedule.binSequence?.length || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    
                      {detailedSchedule.notes && (
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                          <h3 className="font-medium text-sm text-slate-500 uppercase">Notes</h3>
                          <div className="text-sm whitespace-pre-wrap">
                            {detailedSchedule.notes}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-sm text-slate-500 uppercase">Assignment</h3>
                        <div className="flex items-center p-3 border bg-white rounded-md">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {detailedSchedule.collector?.firstName 
                                ? `${detailedSchedule.collector.firstName} ${detailedSchedule.collector.lastName || ''}` 
                                : 'Unassigned'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {detailedSchedule.collector?.phone || 'No contact information'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-sm text-slate-500 uppercase">Area</h3>
                        <div className="flex items-center p-3 border bg-white rounded-md">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <MapPin className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-medium">{areaName}</p>
                            <p className="text-xs text-slate-500">
                              Collection Area
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-sm text-slate-500 uppercase">Status</h3>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant={detailedSchedule.status === "scheduled" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange("scheduled")}
                            disabled={changeStatusLoading}
                            className={detailedSchedule.status === "scheduled" ? "bg-blue-600" : ""}
                          >
                            <Check className={cn("mr-1 h-4 w-4", 
                              detailedSchedule.status === "scheduled" ? "opacity-100" : "opacity-0")} />
                            Scheduled
                          </Button>
                          <Button 
                            variant={detailedSchedule.status === "in-progress" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange("in-progress")}
                            disabled={changeStatusLoading}
                            className={detailedSchedule.status === "in-progress" ? "bg-amber-600" : ""}
                          >
                            <Check className={cn("mr-1 h-4 w-4", 
                              detailedSchedule.status === "in-progress" ? "opacity-100" : "opacity-0")} />
                            In Progress
                          </Button>
                          <Button 
                            variant={detailedSchedule.status === "completed" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange("completed")}
                            disabled={changeStatusLoading}
                            className={detailedSchedule.status === "completed" ? "bg-green-600" : ""}
                          >
                            <Check className={cn("mr-1 h-4 w-4", 
                              detailedSchedule.status === "completed" ? "opacity-100" : "opacity-0")} />
                            Completed
                          </Button>
                          <Button 
                            variant={detailedSchedule.status === "cancelled" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleStatusChange("cancelled")}
                            disabled={changeStatusLoading}
                            className={detailedSchedule.status === "cancelled" ? "bg-red-600" : ""}
                          >
                            <Check className={cn("mr-1 h-4 w-4", 
                              detailedSchedule.status === "cancelled" ? "opacity-100" : "opacity-0")} />
                            Cancelled
                          </Button>
                          {changeStatusLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="route" className="py-4">
                  <div className="h-[450px] border rounded-md overflow-hidden">
                    {detailedSchedule.route && detailedSchedule.route.length > 0 ? (
                      <BinMap 
                        optimizedRoute={detailedSchedule.route}
                        bins={[]} // We would need to fetch bin details
                        style={{ height: "450px" }}
                        fitToRoute={true}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">No route data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="bins" className="py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Collection Sequence</h3>
                      <span className="text-sm text-slate-500">
                        {detailedSchedule.binSequence?.length || 0} bins total
                      </span>
                    </div>
                    
                    {(detailedSchedule.binSequence || []).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                        {(detailedSchedule.binSequence || []).map((binId: string, index: number) => (
                          <div key={binId} className="flex items-center p-3 border rounded-md">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full mr-3">
                              {index + 1}
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium truncate">Bin: {binId}</p>
                              <div className="flex items-center mt-1">
                                <Clock className="h-3 w-3 text-slate-400 mr-1" />
                                <span className="text-xs text-slate-500">
                                  Estimated arrival: {
                                    detailedSchedule.startTime ? 
                                    format(
                                      new Date(new Date(detailedSchedule.startTime).getTime() + (index * 10 * 60000)),
                                      "h:mm a"
                                    ) : 'Not available'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-36 flex items-center justify-center border rounded-md">
                        <div className="text-center">
                          <Truck className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500">No bin sequence data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="flex items-center justify-between border-t pt-4">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(detailedSchedule)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Day Schedule Card Component
const DayScheduleCard = ({ 
  day, 
  schedules,
  onViewDetails,
  isSelected,
  onSelectDay 
}: { 
  day: Date, 
  schedules: Schedule[], 
  onViewDetails: (schedule: Schedule) => void,
  isSelected: boolean,
  onSelectDay: (day: Date) => void
}) => {
  const daySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    return isSameDay(scheduleDate, day);
  });
  
  const formattedDay = format(day, "d");
  const dayName = format(day, "EEE");
  const isToday = isSameDay(day, new Date());
  
  // Group schedules by status
  const scheduled = daySchedules.filter(s => s.status === 'scheduled').length;
  const inProgress = daySchedules.filter(s => s.status === 'in-progress').length;
  const completed = daySchedules.filter(s => s.status === 'completed').length;
  
  return (
    <div 
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-colors",
        isSelected ? "ring-2 ring-blue-600 border-blue-300 bg-blue-50" : 
        isToday ? "border-blue-200 bg-blue-50" : "hover:bg-slate-50",
      )}
      onClick={() => onSelectDay(day)}
    >
      <div className="text-center mb-2">
        <p className={cn(
          "text-xs font-medium",
          isToday ? "text-blue-600" : "text-slate-500"
        )}>
          {dayName}
        </p>
        <p className={cn(
          "text-2xl font-semibold",
          isToday && "text-blue-600"
        )}>
          {formattedDay}
        </p>
      </div>
      
      {daySchedules.length > 0 ? (
        <div className="space-y-1.5">
          {scheduled > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Scheduled:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {scheduled}
              </Badge>
            </div>
          )}
          
          {inProgress > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">In Progress:</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {inProgress}
              </Badge>
            </div>
          )}
          
          {completed > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Completed:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {completed}
              </Badge>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-7 mt-1"
            onClick={(e) => {
              e.stopPropagation();
              if (daySchedules.length === 1) {
                onViewDetails(daySchedules[0]);
              }
            }}
          >
            {daySchedules.length === 1 ? "View" : `${daySchedules.length} schedules`}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[76px]">
          <p className="text-xs text-slate-400">No schedules</p>
        </div>
      )}
    </div>
  );
};

export default function SchedulePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date());
  
  // Additional state for filtering
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterArea, setFilterArea] = useState<string>("");
  const [filterCollector, setFilterCollector] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Add state for delete confirm dialog
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  
  // Format date for display
  const formattedDate = format(selectedDate, "MMMM d, yyyy");
  const dayOfWeek = format(selectedDate, "EEEE");
  
  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(weekStartDate, i);
  });
  
  // Handle previous week
  const goToPreviousWeek = () => {
    setWeekStartDate(subDays(weekStartDate, 7));
  };
  
  // Handle next week
  const goToNextWeek = () => {
    setWeekStartDate(addDays(weekStartDate, 7));
  };
  
  // Get all collectors for assignment
  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        const response = await getActiveCollectors();
        if (response && response.collectors) {
          setCollectors(response.collectors);
        }
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };
    
    fetchCollectors();
  }, []);
  
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
        
        // Fetch schedules with date parameter
        const schedulesData = await getAllSchedules({ date: dateString });
        
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
  
  // Filter schedules when filter criteria change
  useEffect(() => {
    let filtered = [...schedules];
    
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    
    // Filter by area
    if (filterArea) {
      filtered = filtered.filter(s => s.areaId === filterArea || s.area?._id === filterArea);
    }
    
    // Filter by collector
    if (filterCollector) {
      filtered = filtered.filter(s => s.collectorId === filterCollector || s.collector?._id === filterCollector);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(query) ||
        s.area?.name?.toLowerCase().includes(query) ||
        s.collector?.firstName?.toLowerCase().includes(query) ||
        s.collector?.lastName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredSchedules(filtered);
  }, [schedules, filterStatus, filterArea, filterCollector, searchQuery]);
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Handle day card click
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
  };

  // Handle view details
  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsOpen(true);
  };
  
  // Handle status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateScheduleStatus(id, newStatus as 'scheduled' | 'in-progress' | 'completed' | 'cancelled');
      
      // Update the schedule in the schedules array
      const updatedSchedules = schedules.map(schedule => {
        if (schedule._id === id) {
          return {
            ...schedule,
            status: newStatus as 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
          };
        }
        return schedule;
      });
      
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error("Error updating schedule status:", error);
    }
  };
  
  // Handle edit schedule
  const handleEditSchedule = (schedule: Schedule) => {
    // Navigate to the routes page with the schedule ID as a parameter
    router.push(`/dashboard/routes?edit=${schedule._id}`);
  };
  
  // Handle delete schedule
  const handleDeleteSchedule = async (id: string) => {
    try {
      setDeleteLoading(true);
      await deleteSchedule(id);
      setSchedules(schedules.filter(s => s._id !== id));
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Handle export
  const handleExport = () => {
    // Implementation for exporting schedules
    alert("Export functionality would be implemented here");
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterStatus("");
    setFilterArea("");
    setFilterCollector("");
    setSearchQuery("");
  };
  
  // Check if any filters are active
  const hasActiveFilters = filterStatus || filterArea || filterCollector || searchQuery;
  
  // Format schedule time
  const formatScheduleTime = (schedule: Schedule) => {
    if (!schedule.startTime) return "Time not set";
    
    const start = new Date(schedule.startTime);
    const end = schedule.endTime ? new Date(schedule.endTime) : null;
    
    const startFormatted = format(start, "h:mm a");
    const endFormatted = end ? format(end, "h:mm a") : null;
    
    return endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
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
            Create Schedule
          </Button>
        </div>
      </div>
      
      {/* Weekly Calendar View */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-400" />
                Weekly Overview
              </CardTitle>
              <CardDescription>
                {format(weekStartDate, "MMMM d")} - {format(addDays(weekStartDate, 6), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Week</span>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Select Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Week</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <DayScheduleCard
                key={format(day, "yyyy-MM-dd")}
                day={day}
                schedules={schedules}
                onViewDetails={handleViewDetails}
                isSelected={isSameDay(day, selectedDate)}
                onSelectDay={handleDaySelect}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Filter and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="search" 
                  placeholder="Search schedules..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.areaID} value={area.areaID}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterCollector} onValueChange={setFilterCollector}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Collector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collectors</SelectItem>
                  {collectors.map(collector => (
                    <SelectItem key={collector._id} value={collector._id}>
                      {`${collector.firstName || ''} ${collector.lastName || ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Schedules List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-slate-400" />
              {dayOfWeek}'s Schedules
            </CardTitle>
            <CardDescription>
              {formattedDate} • {filteredSchedules.length} {filteredSchedules.length === 1 ? 'schedule' : 'schedules'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-md space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSchedules.length > 0 ? (
            <div className="space-y-4">
              {filteredSchedules.map((schedule, index) => (
                <div
                  key={schedule._id || `schedule-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-md bg-slate-100">
                      <Truck className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{schedule.name || 'Unnamed Schedule'}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatScheduleTime(schedule)}
                        </div>
                        <StatusBadge status={schedule.status} />
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {schedule.area?.name || "Unknown area"}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <User className="h-3.5 w-3.5" />
                          {(schedule.collector && schedule.collector.firstName) 
                            ? `${schedule.collector.firstName} ${schedule.collector.lastName || ''}` 
                            : "Unassigned"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleViewDetails(schedule)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                <CalendarIcon className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium">No schedules found</h3>
              {hasActiveFilters ? (
                <>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    No schedules match your current filters
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetFilters} 
                    className="mx-auto"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-1">
                  No collection schedules for {formattedDate}
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <p className="text-sm text-slate-500">
            {filteredSchedules.length} {filteredSchedules.length === 1 ? 'schedule' : 'schedules'} found
          </p>
          {filteredSchedules.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/routes")}>
              <Plus className="mr-1 h-4 w-4" />
              Add Schedule
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Schedule details dialog */}
      <ScheduleDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        schedule={selectedSchedule}
        onStatusChange={handleStatusChange}
        onEdit={handleEditSchedule}
        onDelete={handleDeleteSchedule}
      />
    </div>
  );
}