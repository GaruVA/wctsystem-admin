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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check,
  Download,
  MapPin,
  Plus,
  Truck,
  User,
  Trash2,
  Clock,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
} from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import BinMap from "@/components/dashboard/bin-map";
import { getAllAreasWithBins, AreaWithBins } from "@/lib/api/areas"; 
import { 
  getAllSchedules, 
  getScheduleById, 
  deleteSchedule, 
  updateScheduleStatus, 
  Schedule,
  getWeeklyScheduleOverview 
} from "@/lib/api/schedules";
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
  onDelete,
}: { 
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onDelete: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailedSchedule, setDetailedSchedule] = useState<Schedule | null>(schedule);

  useEffect(() => {
    if (schedule?._id && isOpen) {
      setIsLoading(true);
      getScheduleById(schedule._id)
        .then(data => {
          console.log("Schedule details fetched:", data);
          console.log("Area info:", data.area);
          console.log("Collector info:", data.collector);
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
    ? format(new Date(detailedSchedule.date), "EEEE, MMM d")
    : 'No date specified';
  const areaName = detailedSchedule.area?.name || 'Unknown area';
  
  // Format duration and distance
  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  const getFormattedTime = () => {
    const created = detailedSchedule.createdAt 
      ? format(new Date(detailedSchedule.createdAt), "EEE, MMM d, h:mm a")
      : 'Unknown';
    return `Created ${created}`;
  };
  
  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return format(new Date(time), "h:mm a");
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
        <DialogContent className="rounded-lg border bg-white text-card-foreground shadow-sm sm:max-w-[900px] p-0 overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                  <CalendarDays size={18} />
                  {scheduleName}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 pt-0">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 grid grid-cols-3 mb-4">
                <TabsTrigger 
                  value="details" 
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <Clock size={16} />
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="route" 
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <MapPin size={16} />
                  Route Map
                </TabsTrigger>
                <TabsTrigger 
                  value="bins" 
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-2"
                >
                  <Truck size={16} />
                  Collection Bins
                </TabsTrigger>
              </TabsList>
            
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  {/* Details Tab */}
                  <TabsContent value="details" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Schedule Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                          <div className="grid grid-cols-2 gap-y-4">
                            <div className="font-medium">Date</div>
                            <div>{scheduleDate}</div>
                            
                            <div className="font-medium">Start Time</div>
                            <div>
                              {detailedSchedule.startTime 
                                ? format(new Date(detailedSchedule.startTime), "h:mm a") 
                                : 'Not set'}
                            </div>
                            
                            <div className="font-medium">End Time</div>
                            <div>
                              {detailedSchedule.endTime 
                                ? format(new Date(detailedSchedule.endTime), "h:mm a") 
                                : 'Not set'}
                            </div>
                            
                            <div className="font-medium">Duration</div>
                            <div>{formatDuration(detailedSchedule.duration || 0)}</div>
                            
                            <div className="font-medium">Distance</div>
                            <div>
                              {typeof detailedSchedule.distance === 'number' 
                                ? `${detailedSchedule.distance.toFixed(1)} km` 
                                : 'Not specified'}
                            </div>
                            
                            <div className="font-medium">Status</div>
                            <div>
                              <StatusBadge status={detailedSchedule.status} />
                            </div>
                          </div>
                          
                          {detailedSchedule.notes && (
                            <div className="pt-4 border-t mt-4">
                              <h4 className="font-medium mb-2">Notes</h4>
                              <div className="bg-muted/50 p-3 rounded-md whitespace-pre-wrap text-sm">
                                {detailedSchedule.notes}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <div className="space-y-6">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              Assigned Collector
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {detailedSchedule.collector ? (
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {`${detailedSchedule.collector.firstName || ''} ${detailedSchedule.collector.lastName || ''}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {detailedSchedule.collector.phone || 'No contact information'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-5 w-5" />
                                </div>
                                <p>No collector assigned</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              Collection Area
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-green-700" />
                              </div>
                              <div>
                                <p className="font-medium">{areaName}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {detailedSchedule.binSequence?.length || 0} bins to collect
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Route Tab */}
                  <TabsContent value="route" className="mt-0">
                    <div className="h-[500px] rounded-md overflow-hidden">
                      {detailedSchedule.route && detailedSchedule.route.length > 0 ? (
                        <BinMap 
                          optimizedRoute={detailedSchedule.route}
                          bins={[]}
                          style={{ height: "500px", width: "100%" }}
                          fitToRoute={true}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-muted/50">
                          <div className="text-center">
                            <MapPin className="h-12 w-12 text-muted mx-auto mb-2" />
                            <p className="text-muted-foreground">No route data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Bins Tab */}
                  <TabsContent value="bins" className="mt-0">
                    <Card>
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Collection Sequence</CardTitle>
                        <Badge variant="outline">{detailedSchedule.binSequence?.length || 0} bins total</Badge>
                      </CardHeader>
                      <CardContent>
                        {(detailedSchedule.binSequence || []).length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 max-h-[400px] overflow-y-auto pr-2">
                            {(detailedSchedule.binSequence || []).map((binId: string, index: number) => (
                              <div key={binId} className="flex items-center p-4 border bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-center w-9 h-9 bg-primary/10 text-primary rounded-full mr-3 font-semibold">
                                  {index + 1}
                                </div>
                                <div className="flex-grow">
                                  <p className="font-medium text-sm">{binId}</p>
                                  <div className="flex items-center mt-1">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                    <span className="text-xs text-muted-foreground">
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
                          <div className="h-36 flex items-center justify-center bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <Truck className="h-12 w-12 text-muted mx-auto mb-2" />
                              <p className="text-muted-foreground">No bin sequence data available</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Day Schedule Card Component
const DayScheduleCard = ({ 
  day, 
  weeklyData,
  onViewDetails,
  isSelected,
  onSelectDay 
}: { 
  day: Date, 
  weeklyData: any[], 
  onViewDetails: (schedule: Schedule) => void,
  isSelected: boolean,
  onSelectDay: (day: Date) => void
}) => {
  // Format current day as YYYY-MM-DD to match with the API data
  const dayFormatted = format(day, "yyyy-MM-dd");
  
  // Find data for this specific day from the weekly overview
  const dayData = weeklyData.find(item => item.date === dayFormatted);
  
  // Get schedule counts by status
  const statusCounts = dayData?.statusCounts || [];
  const scheduled = statusCounts.find((s: { status: string; count: number }) => s.status === 'scheduled')?.count || 0;
  const inProgress = statusCounts.find((s: { status: string; count: number }) => s.status === 'in-progress')?.count || 0;
  const completed = statusCounts.find((s: { status: string; count: number }) => s.status === 'completed')?.count || 0;
  const cancelled: number = statusCounts.find((s: { status: string; count: number }) => s.status === 'cancelled')?.count || 0;
  const totalCount = dayData?.totalCount || 0;
  
  // Format day number and name
  const formattedDay = format(day, "d");
  const dayName = format(day, "EEE"); // Use standard 3-letter weekday format (Sun, Mon, Tue...)
  const isToday = isSameDay(day, new Date());
  
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
          "text-sm font-medium",
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
      
      {totalCount > 0 ? (
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

          {cancelled > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Cancelled:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {cancelled}
              </Badge>
            </div>
          )}
          
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
  // Initialize selectedDate to today by default
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Initialize weekStartDate to the Sunday of the current week
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    // Subtract the day of week to get to the previous Sunday
    return subDays(today, dayOfWeek);
  });
  
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
  
  // Update weekly data fetching to use the new weekly overview endpoint
  useEffect(() => {
    const fetchWeeklyOverview = async () => {
      try {
        setIsLoading(true);
        
        // Calculate week start and end dates
        const weekStartFormatted = format(weekStartDate, "yyyy-MM-dd");
        const weekEndFormatted = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
        
        // Fetch areas (still needed for displaying area names)
        const areasData = await getAllAreasWithBins();
        setAreas(areasData);
        
        // Fetch weekly overview data
        const weeklyOverviewResponse = await getWeeklyScheduleOverview({
          fromDate: weekStartFormatted,
          toDate: weekEndFormatted
        });
        
        // Process the weekly overview data
        const weeklyData = weeklyOverviewResponse.data || [];
        setWeeklyData(weeklyData);
        
        // Fetch daily schedules for the selected date
        fetchDailySchedules(selectedDate);
      } catch (err) {
        console.error('Error fetching weekly overview:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWeeklyOverview();
  }, [weekStartDate]); // Only refetch when the week changes

  // Separate function to fetch daily schedules
  const fetchDailySchedules = async (date: Date) => {
    try {
      setIsLoading(true);
      
      // Format date for API query
      const dateString = format(date, "yyyy-MM-dd");
      
      // Fetch schedules specifically for the selected date
      const schedulesData = await getAllSchedules({ date: dateString });
      
      // Process schedules to ensure area and collector info is available
      const processedSchedules = schedulesData.map((schedule: Schedule) => {
        if (!schedule.area && schedule.areaId) {
          const matchingArea = areas.find((area: any) => area.areaID === schedule.areaId);
          if (matchingArea) {
            schedule.area = {
              _id: matchingArea.areaID,
              name: matchingArea.areaName
            };
          }
        }
        return schedule;
      });
      
      // Update filtered schedules state with the daily data
      setFilteredSchedules(processedSchedules);
    } catch (err) {
      console.error('Error fetching daily schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    
    // Filter schedules for the newly selected date
    const selectedDateFormatted = format(date, "yyyy-MM-dd");
    const filteredForSelectedDate = schedules.filter((schedule: Schedule) => {
      const scheduleDate = schedule.date ? format(new Date(schedule.date), "yyyy-MM-dd") : null;
      return scheduleDate === selectedDateFormatted;
    });
    
    setFilteredSchedules(filteredForSelectedDate);
  };
  
  // Handle day card click
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    
    // Fetch the schedules for the selected day
    fetchDailySchedules(day);
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
        <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => router.push("/dashboard/routes")}>
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
              <CardDescription className="mt-1.5">
                {format(weekStartDate, "MMMM d")} - {format(addDays(weekStartDate, 6), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous Week
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next Week
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day) => (
              <DayScheduleCard
                key={format(day, "yyyy-MM-dd")}
                day={day}
                weeklyData={weeklyData}
                onViewDetails={handleViewDetails}
                isSelected={isSameDay(day, selectedDate)}
                onSelectDay={handleDaySelect}
              />
            ))}
          </div>
        </CardContent>
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
              <p className="text-sm text-slate-500 mt-1">
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
        onDelete={handleDeleteSchedule}
      />
    </div>
  );
}