"use client";

// --- Combined Imports ---
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // From schedule
import axios from "axios"; // From routes (though schedule might use it indirectly)
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
import { Skeleton } from "@/components/ui/skeleton"; // From schedule
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
} from "@/components/ui/alert-dialog"; // From schedule
import { Slider } from "@/components/ui/slider"; // From routes
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // From routes
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // From routes
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // From routes
import {
  // Combined Icons (remove duplicates)
  Route, // routes
  MapPin,
  Calendar, // routes
  Clock,
  Trash2,
  RotateCcw, // routes
  RefreshCcw, // routes
  Check,
  Plus,
  Save, // routes
  Edit, // routes
  ChevronRight,
  ArrowRightLeft, // routes
  Info, // routes
  AlertCircle, // routes
  Truck,
  User,
  List, // routes
  MapIcon, // routes
  XCircle, // routes
  Loader2,
  MoveVertical, // routes
  Settings, // routes
  Download, // schedule
  CalendarDays, // schedule
  ChevronLeft, // schedule
  CalendarIcon, // schedule
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
  saveRouteSchedule, // routes (schedule uses saveRouteSchedule via API call)
  OptimizedRoute,
  RouteParameters
} from "@/lib/api/routes"; // From routes
import { getAllCollectors, getActiveCollectors } from "@/lib/api/collectors"; // Combined
import { Collector } from "@/lib/types/collector"; // From routes (schedule uses Collector type)
import {
  getAllSchedules,
  getScheduleById,
  deleteSchedule,
  updateScheduleStatus,
  Schedule, // schedule
  getWeeklyScheduleOverview
} from "@/lib/api/schedules"; // From schedule
import { format, addDays, subDays, isSameDay } from "date-fns"; // From schedule
import { cn } from "@/lib/utils";


// --- Interfaces & Types (Combined, check for conflicts if any) ---

// From routes/page.tsx
interface RouteData {
  id?: string;
  name: string;
  createdAt: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  bins: (Bin & {
    sequenceNumber: number;
    estimatedArrival: string;
  })[];
  collector: any; // Consider using Collector type if possible
  area: {
    id: string;
    name: string;
  };
  totalDistance: number;
  estimatedDuration: number;
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  routePolyline?: [number, number][];
}

// Note: The 'Schedule' type is imported directly from @/lib/api/schedules


// --- Schedule Component (from schedule/page.tsx, renamed) ---

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
  const [confirmDelete, setConfirmDelete] = useState(false); // Keep for potential future use with AlertDialog
  const [detailedSchedule, setDetailedSchedule] = useState<Schedule | null>(schedule);

  useEffect(() => {
    if (schedule?._id && isOpen) {
      setIsLoading(true);
      getScheduleById(schedule._id, true) // populateBins = true
        .then(data => {
          console.log("Schedule details fetched:", data);
          setDetailedSchedule(data);
        })
        .catch(err => console.error("Error fetching schedule details:", err))
        .finally(() => setIsLoading(false));
    } else {
      setDetailedSchedule(schedule);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !detailedSchedule) return null;

  const scheduleName = detailedSchedule.name || 'Unnamed Schedule';
  const scheduleDate = detailedSchedule.date
    ? format(new Date(detailedSchedule.date), "EEEE, MMM d")
    : 'No date specified';
  const areaName = detailedSchedule.area?.name || 'Unknown area';

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

    // Handle delete confirmation (Added AlertDialog trigger)
  const handleDelete = () => {
    setConfirmDelete(true); // Open the confirmation dialog
  };

  // Actual deletion logic triggered by AlertDialog
  const confirmDeletion = () => {
    if (detailedSchedule._id) {
        onDelete(detailedSchedule._id);
        setConfirmDelete(false); // Close confirmation dialog
        onClose(); // Close main details dialog
    }
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="rounded-lg border bg-white text-card-foreground shadow-sm sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{scheduleName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                  <CalendarDays size={18} />
                  {scheduleName}
                </div>
                 <CardDescription className="mt-1.5">
                   {scheduleDate} • {areaName} • <StatusBadge status={detailedSchedule.status} />
                 </CardDescription>
              </div>
               <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
               </Button>
            </div>
          </div>

          <div className="p-6 pt-0">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 grid grid-cols-3 mb-4">
                <TabsTrigger
                  value="details"
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-1"
                >
                  <Clock size={16} />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="route"
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-1"
                >
                  <MapPin size={16} />
                  Route Map
                </TabsTrigger>
                <TabsTrigger
                  value="bins"
                  className="justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm flex items-center gap-1"
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
                        <RouteMap
                          routeBins={Array.isArray(detailedSchedule.binSequence)
                            ? detailedSchedule.binSequence
                                .filter((bin): bin is any => typeof bin === 'object' && bin !== null && '_id' in bin)
                            : []}
                          routePolyline={detailedSchedule.route}
                          style={{ height: "500px", width: "100%" }}
                          showSequenceNumbers={true}
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
                            {(detailedSchedule.binSequence || []).map((bin: any, index: number) => {
                              const isBinObject = bin && typeof bin !== 'string' && bin._id;
                              const binId = isBinObject ? bin._id : bin;

                              const getFillLevelColor = (level: number) => {
                                if (level >= 90) return "bg-red-500 text-white";
                                if (level >= 70) return "bg-amber-500 text-white";
                                if (level >= 50) return "bg-yellow-500 text-black";
                                return "bg-green-500 text-white";
                              };

                              return (
                                <div
                                  key={binId}
                                  className={`flex items-start p-4 border rounded-lg ${isBinObject ? 'bg-white shadow-sm' : 'bg-muted/30'}`}
                                >
                                  <div className="flex items-center justify-center w-9 h-9 bg-primary/10 text-primary rounded-full mr-3 font-semibold flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <div className="flex-grow">
                                    {isBinObject ? (
                                      <>
                                        <div className="flex justify-between items-start">
                                          <p className="font-medium text-sm">{binId}</p>
                                          <Badge variant="outline" className="ml-2">
                                            {bin.wasteType ? (bin.wasteType.charAt(0) + bin.wasteType.slice(1).toLowerCase()) : 'General'}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{bin.address || 'Unknown address'}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                          <div className="flex items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${getFillLevelColor(bin.fillLevel || 0)}`} />
                                            <span className="text-xs">{bin.fillLevel || 0}% Full</span>
                                          </div>
                                          <div className="flex items-center">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                            <span className="text-xs text-muted-foreground">
                                              {detailedSchedule.startTime ?
                                                format(
                                                  new Date(new Date(detailedSchedule.startTime).getTime() + (index * 10 * 60000)), // Simple estimate
                                                  "h:mm a"
                                                ) : 'Not available'}
                                            </span>
                                          </div>
                                        </div>
                                        {bin.lastCollected && (
                                          <div className="mt-1 text-xs text-slate-500">
                                            Last collected: {format(new Date(bin.lastCollected), "MMM d, yyyy")}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-medium text-sm">{binId}</p>
                                        <div className="flex items-center mt-1">
                                          <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                          <span className="text-xs text-muted-foreground">
                                            {detailedSchedule.startTime ?
                                              format(
                                                new Date(new Date(detailedSchedule.startTime).getTime() + (index * 10 * 60000)), // Simple estimate
                                                "h:mm a"
                                              ) : 'Not available'}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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
           <DialogFooter className="p-6 pt-0">
             <Button variant="outline" onClick={onClose}>Close</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Delete Confirmation Dialog */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the schedule
                    "{scheduleName}".
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeletion} className="bg-red-600 hover:bg-red-700">
                    Delete Schedule
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
  weeklyData,
  onViewDetails, // Keep this prop if needed elsewhere, though not used in this card
  isSelected,
  onSelectDay
}: {
  day: Date,
  weeklyData: any[],
  onViewDetails: (schedule: Schedule) => void, // Keep type consistency
  isSelected: boolean,
  onSelectDay: (day: Date) => void
}) => {
  const dayFormatted = format(day, "yyyy-MM-dd");
  const dayData = weeklyData.find(item => item.date === dayFormatted);

  const statusCounts = dayData?.statusCounts || [];
  const scheduled = statusCounts.find((s: { status: string; count: number }) => s.status === 'scheduled')?.count || 0;
  const inProgress = statusCounts.find((s: { status: string; count: number }) => s.status === 'in-progress')?.count || 0;
  const completed = statusCounts.find((s: { status: string; count: number }) => s.status === 'completed')?.count || 0;
  const cancelled: number = statusCounts.find((s: { status: string; count: number }) => s.status === 'cancelled')?.count || 0;
  const totalCount = dayData?.totalCount || 0;

  const formattedDay = format(day, "d");
  const dayName = format(day, "EEE");
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
        <div className="flex items-center justify-center h-[76px]"> {/* Adjust height as needed */}
          <p className="text-xs text-slate-400">No schedules</p>
        </div>
      )}
    </div>
  );
};


export function ScheduleComponent() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [areas, setAreas] = useState<AreaWithBins[]>([]); // Keep for context if needed
  const [collectors, setCollectors] = useState<Collector[]>([]); // Keep for context if needed
  const [schedules, setSchedules] = useState<Schedule[]>([]); // Holds all fetched schedules for potential client-side filtering
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]); // Schedules for the selected day
  const [weeklyData, setWeeklyData] = useState<any[]>([]); // Overview data
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const dayOfWeek = today.getDay(); // 0 is Sunday
    return subDays(today, dayOfWeek);
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const formattedDate = format(selectedDate, "MMMM d, yyyy");
  const dayOfWeek = format(selectedDate, "EEEE");

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));

  const goToPreviousWeek = () => setWeekStartDate(subDays(weekStartDate, 7));
  const goToNextWeek = () => setWeekStartDate(addDays(weekStartDate, 7));

  // Fetch collectors (could be moved to a shared context later)
  useEffect(() => {
    const fetchCollectorsData = async () => {
      try {
        const response = await getActiveCollectors();
        if (response && response.collectors) {
          setCollectors(response.collectors);
        }
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };
    fetchCollectorsData();
  }, []);

  // Fetch weekly overview and initial daily schedules
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const weekStartFormatted = format(weekStartDate, "yyyy-MM-dd");
        const weekEndFormatted = format(addDays(weekStartDate, 6), "yyyy-MM-dd");

        // Fetch areas (if needed for context, e.g., dropdowns)
        // const areasData = await getAllAreasWithBins();
        // setAreas(areasData);

        // Fetch weekly overview
        const weeklyOverviewResponse = await getWeeklyScheduleOverview({
          fromDate: weekStartFormatted,
          toDate: weekEndFormatted
        });
        setWeeklyData(weeklyOverviewResponse.data || []);

        // Fetch schedules for the initially selected date (today)
        await fetchDailySchedules(selectedDate);

      } catch (err) {
        console.error('Error fetching initial schedule data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [weekStartDate]); // Refetch when week changes

  // Function to fetch schedules for a specific day
  const fetchDailySchedules = async (date: Date) => {
    try {
      setIsLoading(true); // Indicate loading for daily fetch too
      const dateString = format(date, "yyyy-MM-dd");
      const schedulesData = await getAllSchedules({ date: dateString });

      // Basic processing: ensure collector/area names if needed (could be enhanced)
      const processedSchedules = schedulesData.map((schedule: Schedule) => {
         // Example: Add collector name if only ID is present
         if (!schedule.collector && schedule.collectorId && collectors.length > 0) {
            const matchingCollector = collectors.find(c => c._id === schedule.collectorId);
            if (matchingCollector) {
              // Normalize collector to fit Schedule.collector type
              schedule.collector = {
                _id: matchingCollector._id,
                firstName: matchingCollector.firstName ?? '',
                lastName: matchingCollector.lastName ?? '',
                username: matchingCollector.username,
                phone: matchingCollector.phone
              };
            }
         }
         // Similar logic for area if needed
         return schedule;
      });


      setFilteredSchedules(processedSchedules);
    } catch (err) {
      console.error('Error fetching daily schedules:', err);
      setFilteredSchedules([]); // Clear schedules on error
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a day from the weekly view
  const handleDaySelect = (day: Date) => {
    setSelectedDate(day);
    fetchDailySchedules(day); // Fetch schedules for the selected day
  };

  const handleViewDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsOpen(true);
  };

  // Handle deleting a schedule (opens confirmation)
  const handleDeleteClick = (id: string) => {
    setScheduleToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  // Actual deletion confirmed via dialog
  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteSchedule(scheduleToDelete);
      // Refetch daily schedules to reflect the deletion
      fetchDailySchedules(selectedDate);
      // Also refetch weekly overview for updated counts
       const weekStartFormatted = format(weekStartDate, "yyyy-MM-dd");
       const weekEndFormatted = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
       const weeklyOverviewResponse = await getWeeklyScheduleOverview({
           fromDate: weekStartFormatted,
           toDate: weekEndFormatted
       });
       setWeeklyData(weeklyOverviewResponse.data || []);

    } catch (error) {
      console.error("Error deleting schedule:", error);
      // Add user feedback (e.g., toast notification)
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
      setScheduleToDelete("");
    }
  };


  const handleExport = () => {
    alert("Export functionality would be implemented here");
  };

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
          {/* Navigate to the combined page or a dedicated creation page */}
          <Button size="sm" onClick={() => router.push("/dashboard/combined-schedule-routes-page")}>
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
           {isLoading && weeklyData.length === 0 ? ( // Show skeleton only during initial week load
                <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-[130px] rounded-lg" /> // Adjust height to match DayScheduleCard
                    ))}
                </div>
            ) : (
               <div className="grid grid-cols-7 gap-3">
                  {weekDays.map((day) => (
                    <DayScheduleCard
                      key={format(day, "yyyy-MM-dd")}
                      day={day}
                      weeklyData={weeklyData}
                      onViewDetails={handleViewDetails} // Pass down if needed by DayScheduleCard interactions
                      isSelected={isSameDay(day, selectedDate)}
                      onSelectDay={handleDaySelect}
                    />
                  ))}
                </div>
            )}
        </CardContent>
      </Card>

      {/* Schedules List for Selected Day */}
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
          {isLoading ? ( // Loading state for daily schedules
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
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatScheduleTime(schedule)}
                        </div>
                        <StatusBadge status={schedule.status} />
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {schedule.area?.name || schedule.areaId || "Unknown area"} {/* Fallback to areaId */}
                        </div>
                         <div className="flex items-center gap-1 text-sm text-slate-500">
                           <User className="h-3.5 w-3.5" />
                           {(schedule.collector && schedule.collector.firstName)
                             ? `${schedule.collector.firstName} ${schedule.collector.lastName || ''}`
                             : schedule.collectorId || "Unassigned"} {/* Fallback to collectorId */}
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline" // Changed to outline for less emphasis
                      onClick={() => handleViewDetails(schedule)}
                    >
                      View Details
                    </Button>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="text-red-500 hover:bg-red-50"
                       onClick={() => handleDeleteClick(schedule._id)} // Use specific handler
                       disabled={deleteLoading && scheduleToDelete === schedule._id} // Disable during delete
                     >
                       {deleteLoading && scheduleToDelete === schedule._id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                           <Trash2 className="h-4 w-4" />
                       )}
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
        onDelete={handleDeleteClick} // Pass the click handler
      />

       {/* Delete Confirmation Dialog (using AlertDialog) */}
       <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. This will permanently delete the schedule.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={confirmDeleteSchedule} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700">
               {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Delete Schedule
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}


// --- Routes Component (from routes/page.tsx, renamed) ---
export function RoutesComponent() {
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

  // Load areas and collectors
  useEffect(() => {
    fetchAreasData();
    fetchCollectorsData();
  }, []);

  const fetchAreasData = async () => {
    try {
      setAreasLoading(true);
      const areasData = await getAllAreasWithBins();
      setAreas(areasData);
      if (areasData.length > 0 && !selectedArea) { // Pre-select only if not already set
        setSelectedArea(areasData[0].areaID);
      }
    } catch (err) {
      console.error('Error fetching areas with bins:', err);
      setError('Failed to load areas data.');
    } finally {
      setAreasLoading(false);
    }
  };

  const fetchCollectorsData = async () => {
    try {
      const response = await getActiveCollectors();
      if (response && response.collectors) {
        setCollectors(response.collectors);
         // Pre-select the first available collector for the initially selected area
         if (areas.length > 0 && selectedArea && !selectedCollector) {
             const firstAreaCollectors = response.collectors.filter(c =>
                 c.status === 'active' &&
                 (c.area?._id === selectedArea || (typeof c.area === 'string' && c.area === selectedArea))
             );
             if (firstAreaCollectors.length > 0) {
                 setSelectedCollector(firstAreaCollectors[0]._id);
             }
         }
      } else {
        setError('Failed to load collectors data: Invalid format.');
      }
    } catch (err) {
      console.error('Error fetching collectors:', err);
      setError('Failed to load collectors data.');
    }
  };

   // Update pre-selected collector when area changes
   useEffect(() => {
        if (selectedArea && collectors.length > 0) {
            const areaCollectors = collectors.filter(c =>
                c.status === 'active' &&
                (c.area?._id === selectedArea || (typeof c.area === 'string' && c.area === selectedArea))
            );
            if (areaCollectors.length > 0) {
                // Only update if the current selection is invalid or unset for the new area
                 const currentSelectionValid = areaCollectors.some(c => c._id === selectedCollector);
                 if (!currentSelectionValid) {
                     setSelectedCollector(areaCollectors[0]._id);
                 }
            } else {
                 setSelectedCollector(""); // No collectors for this area
            }
        }
   }, [selectedArea, collectors]); // Rerun when area or collectors list changes


  // Auto-generate route name
  useEffect(() => {
    if (selectedArea && scheduleDate && areas.length > 0) {
      const selectedAreaObj = areas.find(a => a.areaID === selectedArea);
      if (selectedAreaObj) {
        const date = new Date(scheduleDate + 'T00:00:00'); // Ensure correct date parsing
        const dateFormat = date.toLocaleDateString('en-US', {
          weekday: 'short', // Use short weekday
          month: 'short',
          day: 'numeric'
        });
        setScheduleName(`${dateFormat} - ${selectedAreaObj.areaName}`);
      }
    }
  }, [selectedArea, scheduleDate, areas]);


  const handleBinSelect = (bin: Bin | null) => {
    setSelectedBin(bin);
  };

  const generateRoute = async () => {
    if (!selectedArea) {
      setError("Please select an area first");
      return;
    }

    setIsGeneratingRoute(true);
    setError(null);

    try {
      const parameters: RouteParameters = {
        fillLevelThreshold: fillThreshold,
        wasteType: wasteTypeFilter,
        includeCriticalBins: includeAllCritical
      };

      const optimizedRoute = await getOptimizedRoute(selectedArea, parameters);

      if (!optimizedRoute || !optimizedRoute.route) { // Check for route property
        throw new Error("Failed to generate route - invalid response from API");
      }

      console.log("Received route data:", optimizedRoute);

      const selectedAreaData = areas.find(area => area.areaID === selectedArea);
      if (!selectedAreaData) throw new Error("Selected area not found");

      // Use already selected collector or find the first available one for the area
       let collector = selectedCollector
         ? collectors.find(c => c._id === selectedCollector)
         : collectors.find(c => c.status === 'active' && (c.area?._id === selectedArea || (typeof c.area === 'string' && c.area === selectedArea)));


      if (!collector) {
        // If still no collector, try finding *any* active collector as a fallback
        collector = collectors.find(c => c.status === 'active');
        if (collector) {
             setSelectedCollector(collector._id); // Auto-assign if found
             console.warn("No collector found for the selected area. Assigned the first available active collector.");
        } else {
             setError("No active collectors available in the system. Cannot create route.");
             setIsGeneratingRoute(false);
             return; // Stop if no collectors at all
        }
      }


      const routeData: OptimizedRoute = optimizedRoute.route;
      const binSequenceIds = optimizedRoute.binSequence || [];
      // Extract polyline directly from routeData.route
      const routePolyline = Array.isArray(routeData.route) ? routeData.route : [];

      const selectedBins = binSequenceIds.map((binId: string, index: number) => {
        const bin = selectedAreaData.bins.find(b => b._id === binId);
        if (!bin) {
          console.warn(`Bin with ID ${binId} not found in area data.`);
          return {
            _id: binId, location: { type: "Point", coordinates: [0, 0] }, fillLevel: 0, lastCollected: new Date().toISOString(),
            address: "Unknown (Data Missing)", wasteType: "GENERAL", sequenceNumber: index + 1, estimatedArrival: new Date(Date.now() + (10 * 60 * 1000) * index).toISOString() // shorter estimate
          };
        }
        return {
          ...bin, sequenceNumber: index + 1,
          estimatedArrival: new Date(Date.now() + (10 * 60 * 1000) * index).toISOString() // shorter estimate
        };
      });

      // Use distance/duration directly from backend response
      let distance = typeof routeData.distance === 'number' ? routeData.distance : 0;
      let duration = typeof routeData.duration === 'number' ? routeData.duration : 0;

      // Apply minimums
      distance = Math.max(0.1, distance);
      duration = Math.max(1, duration);

      const startCoordinates = selectedAreaData.startLocation?.coordinates || [79.861, 6.927]; // Default Colombo
      const endCoordinates = selectedAreaData.endLocation?.coordinates || startCoordinates;

      const route: RouteData = {
        name: scheduleName, createdAt: new Date().toISOString(), status: 'scheduled',
        bins: selectedBins, collector: collector, area: { id: selectedAreaData.areaID, name: selectedAreaData.areaName },
        totalDistance: distance, estimatedDuration: duration,
        startLocation: { lat: startCoordinates[1], lng: startCoordinates[0], name: "Depot" },
        endLocation: { lat: endCoordinates[1], lng: endCoordinates[0], name: "Disposal" },
        routePolyline: routePolyline
      };

      setCurrentRoute(route);
      setShowAssignment(true);
    } catch (err: any) {
      console.error('Error generating route:', err);
      setError(`Failed to generate route: ${err.message || 'Please check console.'}`);
    } finally {
      setIsGeneratingRoute(false);
    }
  };


  const handleBinReorder = (sourceIndex: number, destinationIndex: number) => {
    if (!currentRoute || !editMode) return;

    const newBins = [...currentRoute.bins];
    const [removed] = newBins.splice(sourceIndex, 1);
    newBins.splice(destinationIndex, 0, removed);

    const reorderedBins = newBins.map((bin, index) => ({
      ...bin, sequenceNumber: index + 1
    }));

    setCurrentRoute({ ...currentRoute, bins: reorderedBins });
    // Note: Reordering manually might invalidate the optimized distance/duration.
    // Consider adding a warning or triggering a route recalculation API call.
  };

  const handleRemoveBin = (binId: string) => {
    if (!currentRoute || !editMode) return;

    const newBins = currentRoute.bins.filter(bin => bin._id !== binId);
    const resequencedBins = newBins.map((bin, index) => ({
      ...bin, sequenceNumber: index + 1
    }));

    setCurrentRoute({ ...currentRoute, bins: resequencedBins });
     // Note: Removing manually might invalidate the optimized distance/duration.
  };

  const saveRoute = async () => {
    if (!currentRoute) return;
    if (!selectedCollector) {
      setError("Please select a collector for this route");
      return;
    }

    setIsGeneratingRoute(true); // Use the same loading state
    setError(null);

    try {
        // Construct schedule start and end times based on date and time inputs
        const scheduleStartDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        const scheduleEndDateTime = new Date(scheduleStartDateTime.getTime() + currentRoute.estimatedDuration * 60000); // Add duration in milliseconds


      const scheduleData = {
        name: currentRoute.name,
        areaId: currentRoute.area.id,
        collectorId: selectedCollector,
        date: scheduleDate, // Ensure date is in YYYY-MM-DD format
        startTime: scheduleStartDateTime.toISOString(),
        endTime: scheduleEndDateTime.toISOString(),
        status: "scheduled",
        notes: notes,
        // Ensure these match backend expectations
        route: currentRoute.routePolyline, // Send coordinates array
        distance: currentRoute.totalDistance,
        duration: currentRoute.estimatedDuration,
        binSequence: currentRoute.bins.map(bin => bin._id) // Array of bin IDs
      };

      console.log("Saving route with data:", scheduleData);
      await saveRouteSchedule(scheduleData);

      // Use toast for success feedback
       // toast({ title: "Success", description: "Route scheduled successfully!" }); // Assuming you have toast imported and configured

      alert("Route scheduled successfully!"); // Fallback alert

      setEditMode(false);
      setShowAssignment(false); // Go back to parameters view
      setCurrentRoute(null);
      setSelectedBin(null);
      // Optionally reset some form fields like notes
      setNotes("");

    } catch (err: any) {
      console.error('Error saving route:', err);
       const errorMessage = err.response?.data?.message || err.message || 'Please try again.';
      setError(`Failed to save route: ${errorMessage}`);
       // toast({ title: "Error", description: `Failed to save route: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsGeneratingRoute(false);
    }
  };


  const handleGoBack = () => {
    setShowAssignment(false);
    setCurrentRoute(null);
    setSelectedBin(null);
    setEditMode(false);
    setError(null); // Clear errors when going back
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60); // Round minutes
    return `${hours}h ${mins}m`;
  };

  const getFillLevelColorClass = (level: number) => {
    if (level >= 90) return "bg-red-500";
    if (level >= 70) return "bg-amber-500";
    if (level >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatDate = (dateString: string) => { // Simple date format
    return new Date(dateString).toLocaleDateString("en-US", {
       year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getAvailableBins = () => {
    if (!selectedArea || !currentRoute) return;
    const areaData = areas.find(area => area.areaID === selectedArea);
    if (!areaData) return;

    const routeBinIds = new Set(currentRoute.bins.map(bin => bin._id));
    const binsNotInRoute = areaData.bins.filter(bin => !routeBinIds.has(bin._id));

    setAvailableBins(binsNotInRoute);
    setSelectedBinsToAdd([]); // Clear previous selections
    setShowAddBinModal(true);
  };

  const handleAddBinsToRoute = () => {
    if (!currentRoute || selectedBinsToAdd.length === 0) return;
    const areaData = areas.find(area => area.areaID === selectedArea);
    if (!areaData) return;

    // Find the full bin objects for the selected IDs
    const binsToAddObjects = selectedBinsToAdd
        .map(binId => areaData.bins.find(b => b._id === binId))
        .filter((bin): bin is Bin => bin !== undefined); // Type guard to filter out undefined

    if (binsToAddObjects.length !== selectedBinsToAdd.length) {
        console.warn("Some selected bins to add were not found in area data.");
    }

     // Add sequence number and estimated arrival time (simple estimate)
     const lastBinTime = currentRoute.bins.length > 0
        ? new Date(currentRoute.bins[currentRoute.bins.length - 1].estimatedArrival).getTime()
        : new Date(`${scheduleDate}T${scheduleTime}`).getTime(); // Use schedule start time if no bins yet


    const binsToAddWithSequence = binsToAddObjects.map((bin, index) => ({
      ...bin,
      sequenceNumber: currentRoute.bins.length + 1 + index,
      estimatedArrival: new Date(lastBinTime + (10 * 60 * 1000) * (index + 1)).toISOString() // Add 10 mins per added bin after the last one
    }));

    const updatedBins = [...currentRoute.bins, ...binsToAddWithSequence];

    setCurrentRoute({ ...currentRoute, bins: updatedBins });
    setShowAddBinModal(false);
     // Note: Adding manually might invalidate the optimized distance/duration.
  };


  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Route Creation</h1>
        <div className="flex items-center gap-3">
          {currentRoute && showAssignment && ( // Show edit/save only in assignment view
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isGeneratingRoute} // Disable while saving
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <><XCircle className="mr-2 h-4 w-4" /> Cancel Edit</>
                ) : (
                  <><Edit className="mr-2 h-4 w-4" /> Edit Route</>
                )}
              </Button>
              {/* Save button moved to Assignment Card for clarity */}
            </>
          )}
          {!showAssignment && ( // Show Generate button only in parameters view
            <Button
              size="sm"
              onClick={generateRoute}
              disabled={isGeneratingRoute || areasLoading} // Disable while loading areas too
            >
              {isGeneratingRoute ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" /> // Use RotateCcw for generation
              )}
              Generate Route
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex justify-between items-center">
          <span>{error}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-700" onClick={() => setError(null)}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Parameters / Assignment Card Column */}
        <div className="md:col-span-1 space-y-6">
            {/* Route Parameters Card */}
            {!showAssignment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings size={18} /> {/* Use Settings icon */}
                    Route Parameters
                  </CardTitle>
                  <CardDescription>
                    Configure settings for route generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Route Name (Auto-generated, but editable) */}
                   <div className="space-y-3">
                     <Label htmlFor="routeName">Route Name</Label>
                     <Input
                       id="routeName"
                       value={scheduleName}
                       onChange={(e) => setScheduleName(e.target.value)}
                       placeholder="e.g., Mon Morning - Area 1"
                     />
                   </div>

                   {/* Schedule Date & Time */}
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label htmlFor="scheduleDate">Date</Label>
                            <Input
                            id="scheduleDate"
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="scheduleTime">Start Time</Label>
                            <Input
                            id="scheduleTime"
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    </div>


                  {/* Collection Area */}
                  <div className="space-y-3">
                    <Label htmlFor="areaSelect">Collection Area</Label>
                    {areasLoading ? (
                         <Skeleton className="h-10 w-full" />
                    ) : (
                        <Select value={selectedArea} onValueChange={setSelectedArea} name="areaSelect">
                        <SelectTrigger id="areaSelect">
                            <SelectValue placeholder="Select an area" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map((area) => (
                            <SelectItem key={area.areaID} value={area.areaID}>
                                {area.areaName}
                            </SelectItem>
                            ))}
                            {areas.length === 0 && <SelectItem value="no-areas" disabled>No areas found</SelectItem>}
                        </SelectContent>
                        </Select>
                    )}
                  </div>

                  {/* Fill Threshold */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fillThresholdSlider">Min. Fill Level</Label>
                      <span className="text-sm font-medium">{fillThreshold}%</span>
                    </div>
                    <Slider
                      id="fillThresholdSlider"
                      value={[fillThreshold]}
                      min={0} max={100} step={5}
                      onValueChange={(value) => setFillThreshold(value[0])}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include bins at or above this fill level.
                    </p>
                  </div>

                  {/* Include Critical Bins */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="critical-bins"
                      checked={includeAllCritical}
                      onCheckedChange={(checked) => setIncludeAllCritical(checked === true)}
                    />
                    <Label htmlFor="critical-bins" className="text-sm font-normal">
                      Always include critical bins (≥ 90%)
                    </Label>
                  </div>

                  {/* Waste Type Filter */}
                  <div className="space-y-3 pt-2">
                    <Label>Waste Type to Prioritize</Label>
                    <RadioGroup
                      value={wasteTypeFilter}
                      defaultValue="GENERAL"
                      onValueChange={setWasteTypeFilter}
                      className="flex flex-col space-y-1"
                    >
                      {["GENERAL", "ORGANIC", "RECYCLE", "HAZARDOUS"].map(type => (
                          <div key={type} className="flex items-center space-x-2">
                              <RadioGroupItem value={type} id={`waste-${type}`} />
                              <Label htmlFor={`waste-${type}`} className="font-normal capitalize">{type.toLowerCase()}</Label>
                          </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      Filters bins based on the selected waste type.
                    </p>
                  </div>

                  {/* Generate Button */}
                  <Button
                    className="w-full mt-4" // Add margin top
                    onClick={generateRoute}
                    disabled={isGeneratingRoute || areasLoading || !selectedArea} // Also disable if no area selected
                  >
                    {isGeneratingRoute ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Generate Optimized Route
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Route Assignment Card */}
          {showAssignment && currentRoute && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User size={18} />
                        Route Assignment
                    </CardTitle>
                    <CardDescription>
                        Assign collector and finalize schedule details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Assign Collector */}
                    <div className="space-y-3">
                        <Label htmlFor="collectorSelect">Assign Collector</Label>
                        <Select value={selectedCollector} onValueChange={setSelectedCollector} name="collectorSelect">
                            <SelectTrigger id="collectorSelect">
                                <SelectValue placeholder="Select collector" />
                            </SelectTrigger>
                            <SelectContent>
                                {collectors
                                .filter(c => c.status === 'active' && (c.area?._id === currentRoute.area.id || (typeof c.area === 'string' && c.area === currentRoute.area.id)))
                                .map((collector) => (
                                    <SelectItem key={collector._id} value={collector._id}>
                                        {collector.firstName ? `${collector.firstName} ${collector.lastName || ''}` : collector.username}
                                    </SelectItem>
                                ))}
                                {collectors.filter(c => c.status === 'active' && (c.area?._id === currentRoute.area.id || (typeof c.area === 'string' && c.area === currentRoute.area.id))).length === 0 && (
                                    <SelectItem value="no-collectors" disabled>No collectors for this area</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Only active collectors assigned to "{currentRoute.area.name}" are shown.
                        </p>
                    </div>

                     {/* Schedule Date & Time (Display Only or Editable?) - Keep editable for adjustments */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label htmlFor="scheduleDateAssign">Date</Label>
                            <Input
                                id="scheduleDateAssign"
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="scheduleTimeAssign">Start Time</Label>
                            <Input
                                id="scheduleTimeAssign"
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    </div>


                    {/* Notes */}
                    <div className="space-y-3">
                        <Label htmlFor="routeNotes">Notes (Optional)</Label>
                        <textarea
                            id="routeNotes"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" // Standard textarea styling
                            placeholder="Add any relevant notes for the collector"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Route Summary */}
                    <div className="space-y-2 pt-3 border-t">
                         <h4 className="text-sm font-medium mb-2">Route Summary</h4>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Total Bins:</span>
                           <span className="font-medium">{currentRoute.bins.length}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Distance:</span>
                           <span className="font-medium">{currentRoute.totalDistance.toFixed(1)} km</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Duration:</span>
                           <span className="font-medium">{formatDuration(currentRoute.estimatedDuration)}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-muted-foreground">Avg. Fill:</span>
                             <span className="font-medium">
                                {currentRoute.bins.length > 0 ?
                                    `${Math.round(currentRoute.bins.reduce((sum, bin) => sum + (bin.fillLevel || 0), 0) / currentRoute.bins.length)}%`
                                    : 'N/A'
                                }
                             </span>
                         </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                        <Button
                            className="w-full"
                            onClick={saveRoute}
                            disabled={!selectedCollector || isGeneratingRoute || editMode} // Disable if editing
                        >
                             {isGeneratingRoute ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save & Dispatch Route
                        </Button>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleGoBack}
                             disabled={editMode} // Disable if editing
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" /> {/* Use ChevronLeft */}
                            Back to Parameters
                        </Button>
                    </div>
                </CardContent>
              </Card>
          )}
         </div>


        {/* Route Display Area (Map and List) */}
        <div className="md:col-span-2 space-y-6">
          {/* Loading state */}
          {isGeneratingRoute && !currentRoute && (
            <Card className="w-full h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium">Generating optimal route...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            </Card>
          )}

          {/* Route Display */}
          {currentRoute && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck size={18} />
                      {currentRoute.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                       <span>{currentRoute.area.name}</span>
                       <span className="text-muted-foreground">•</span>
                       <span>{currentRoute.bins.length} stops</span>
                       <span className="text-muted-foreground">•</span>
                       <span>{formatDuration(currentRoute.estimatedDuration)}</span>
                        <span className="text-muted-foreground">•</span>
                       <span>{currentRoute.totalDistance.toFixed(1)} km</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                     {/* Status could be shown here if relevant */}
                     <span className="text-xs text-muted-foreground">
                       Generated: {formatDate(currentRoute.createdAt)}
                     </span>
                     {editMode && <Badge variant="destructive" className="mt-1">Editing Mode</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="map" className="flex items-center gap-2">
                      <MapIcon size={16} /> Map View
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                      <List size={16} /> Sequence View
                    </TabsTrigger>
                  </TabsList>

                  {/* Map View */}
                  <TabsContent value="map" className="m-0">
                    <div className="h-[500px] rounded-md overflow-hidden border"> {/* Add border */}
                      <RouteMap
                        routeBins={currentRoute.bins}
                        routePolyline={currentRoute.routePolyline}
                        area={areas.find(area => area.areaID === selectedArea)}
                        onBinSelect={handleBinSelect}
                        selectedBin={selectedBin}
                        style={{ height: "100%", width: "100%" }} // Ensure map fills container
                        showSequenceNumbers={true}
                      />
                    </div>
                  </TabsContent>

                  {/* List View */}
                  <TabsContent value="list" className="m-0">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-medium">Route Sequence</h3>
                           {editMode && (
                               <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={getAvailableBins}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Bin
                                </Button>
                           )}
                       </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {editMode
                          ? "Drag to reorder, click trash to remove."
                          : "Optimized collection sequence."}
                      </p>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2"> {/* Scrollable list */}
                        {/* Start Location */}
                        <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-md">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full mr-3 flex-shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium text-sm">Start: {currentRoute.startLocation.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                              selectedBin && selectedBin._id === bin._id ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400" : "border-gray-200" // Enhanced selection style
                            )}
                            onClick={() => handleBinSelect(bin)}
                            draggable={editMode}
                            onDragStart={(e) => { if (editMode) e.dataTransfer.setData('text/plain', String(index)); }}
                            onDragOver={(e) => { if (editMode) e.preventDefault(); }}
                            onDrop={(e) => { if (editMode) { e.preventDefault(); const sourceIndex = parseInt(e.dataTransfer.getData('text/plain')); handleBinReorder(sourceIndex, index); } }}
                          >
                            {editMode && <MoveVertical size={16} className="text-gray-400 mr-2 flex-shrink-0" />}
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full mr-3 flex-shrink-0 text-sm">
                              {bin.sequenceNumber}
                            </div>
                            <div className="flex-grow min-w-0"> {/* Prevent overflow */}
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-medium text-sm truncate" title={bin._id}>{bin._id}</p> {/* Truncate ID */}
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {bin.wasteType ? (bin.wasteType.charAt(0) + bin.wasteType.slice(1).toLowerCase()) : 'General'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate" title={bin.address}>{bin.address || 'No address'}</p>
                              <div className="flex items-center mt-1 gap-x-3">
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-1 ${getFillLevelColorClass(bin.fillLevel || 0)}`} />
                                  <span className="text-xs">{bin.fillLevel || 0}% Full</span>
                                </div>
                                <div className="flex items-center">
                                     <Clock size={12} className="text-gray-500 mr-1" />
                                     <span className="text-xs">
                                       {new Date(bin.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                </div>
                              </div>
                            </div>
                            {editMode && (
                              <Button
                                size="icon" // Make it an icon button
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 h-8 w-8 flex-shrink-0" // Adjust size and margin
                                onClick={(e) => { e.stopPropagation(); handleRemoveBin(bin._id); }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        ))}

                        {/* End Location */}
                        <div className="flex items-center p-3 border border-blue-200 bg-blue-50 rounded-md">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full mr-3 flex-shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium text-sm">End: {currentRoute.endLocation.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Est. arrival: {new Date(new Date(`${scheduleDate}T${scheduleTime}`).getTime() + currentRoute.estimatedDuration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
               {editMode && ( // Footer for edit mode actions
                 <CardFooter className="flex justify-end border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setEditMode(false);
                            // Optionally reset route to original state before edits or refetch
                            // generateRoute(); // Re-generating might be too slow, consider storing original
                            setError("Edits cancelled. Route reverted to last generated state."); // Inform user
                            // To truly revert, you'd need to store the state before editMode=true
                        }}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Edits
                    </Button>
                    {/* Save button is in the Assignment Card */}
                 </CardFooter>
               )}
            </Card>
          )}

          {/* Placeholder when no route is generated yet */}
          {!isGeneratingRoute && !currentRoute && (
            <Card className="w-full h-[600px] flex items-center justify-center border-dashed"> {/* Dashed border */}
              <div className="text-center max-w-md p-6">
                <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Route Not Generated</h3>
                <p className="text-muted-foreground">
                  Configure parameters and click "Generate Optimized Route".
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Bin Modal */}
      {showAddBinModal && currentRoute && (
         <Dialog open={showAddBinModal} onOpenChange={setShowAddBinModal}>
              <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                  <DialogTitle>Add Bins to Route</DialogTitle>
                  <DialogDescription>
                      Select available bins from "{currentRoute.area.name}" to add manually.
                  </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Scrollable content */}
                    {availableBins.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No more bins available in this area.</p>
                    ) : (
                        <div className="space-y-2">
                        {availableBins.map(bin => (
                            <div
                                key={bin._id}
                                className={cn(
                                    "flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50",
                                    selectedBinsToAdd.includes(bin._id) ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400" : "border-gray-200"
                                )}
                                onClick={() => {
                                    setSelectedBinsToAdd(prev =>
                                    prev.includes(bin._id)
                                        ? prev.filter(id => id !== bin._id)
                                        : [...prev, bin._id]
                                    );
                                }}
                            >
                                <Checkbox
                                    checked={selectedBinsToAdd.includes(bin._id)}
                                    className="mr-3"
                                    // Prevent click propagation to the div
                                    onClick={(e) => e.stopPropagation()}
                                    onCheckedChange={(checked) => {
                                         setSelectedBinsToAdd(prev =>
                                            checked
                                            ? [...prev, bin._id]
                                            : prev.filter(id => id !== bin._id)
                                        );
                                    }}
                                />
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-medium text-sm truncate" title={bin._id}>{bin._id}</p>
                                        <Badge variant="outline" className="text-xs flex-shrink-0">
                                            {bin.wasteType ? (bin.wasteType.charAt(0) + bin.wasteType.slice(1).toLowerCase()) : 'General'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate" title={bin.address}>{bin.address || 'No address'}</p>
                                    <div className="flex items-center mt-1">
                                        <div className={`w-2 h-2 rounded-full mr-1 ${getFillLevelColorClass(bin.fillLevel || 0)}`} />
                                        <span className="text-xs">{bin.fillLevel || 0}% Full</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddBinModal(false)}>Cancel</Button>
                      <Button
                          onClick={handleAddBinsToRoute}
                          disabled={selectedBinsToAdd.length === 0}
                      >
                          Add {selectedBinsToAdd.length} {selectedBinsToAdd.length === 1 ? 'Bin' : 'Bins'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
         </Dialog>
      )}
    </div>
  );
}


// --- Main Combined Page Component ---
export default function SchedulerPage() {
  return (
    <div>
      {/* Render Schedule Component First */}
      <section className="mb-8">
        <ScheduleComponent />
      </section>

      <hr className="my-8 border-t-2" /> {/* Make separator more prominent */}

      {/* Render Routes Component Second */}
      <section>
        <RoutesComponent />
      </section>
    </div>
  );
}