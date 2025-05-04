// filepath: c:\Users\0002288\Desktop\wct\admin\app\dashboard\page.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BinMap from "@/components/dashboard/bin-map";
import SuggestionBinMap from "@/components/dashboard/suggestion-bin-map";
import {
  RefreshCcw,
  Trash2,
  Truck,
  ArrowUpRight,
  Percent,
  Map,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Recycle,
  CalendarClock,
  TrendingUp,
  BarChart4
} from "lucide-react";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";
import { getAllSchedules, Schedule } from "@/lib/api/schedules";
import { cn } from "@/lib/utils";
import { getUnreadAlerts, Alert, AlertSeverity, AlertType, markAsRead, markAllAsRead } from "@/lib/api/alerts";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";



interface Issue {
  _id: string;
  bin: { _id: string };
  issueType: string;
  description?: string;
  createdAt: string;
}

interface BinSuggestion {
  _id: string;
  reason: string;
  location: {
    longitude: number;
    latitude: number;
  };
  address?: string; // Added optional address property
  createdAt: string;
}

// Define types for dashboard metrics
interface DashboardMetrics {
  totalAreas: number;
  totalBins: number;
  fillLevelTrendToday: number;
  collectionsToday: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [todaysRoutes, setTodaysRoutes] = useState<Array<{_id: string; route: [number, number][]}>>([]);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [binSuggestions, setBinSuggestions] = useState<BinSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BinSuggestion | null>(null);
  const [suggestionBins, setSuggestionBins] = useState<Bin[]>([]); // New state for suggestion bins formatted for map
  const [analytics, setAnalytics] = useState<DashboardMetrics>({
    totalAreas: 0,
    totalBins: 0,
    fillLevelTrendToday: 0,
    collectionsToday: 0
  });

  useEffect(() => {
    fetchAreas();
    fetchAlerts();
    fetchAnalytics();
    // Fetch today's schedules
    const fetchTodays = async () => {
      // Use the same date format method as in schedules page
      const today = new Date();
      const dateString = format(today, "yyyy-MM-dd");
      try {
        console.log('Fetching schedules for today:', dateString);
        const schedules = await getAllSchedules({ date: dateString });
        console.log('Found schedules:', schedules.length);
        setTodaysRoutes(schedules.map(s => ({ _id: s._id, route: s.route })));
      } catch (err) {
        console.error('Error fetching today\'s schedules:', err);
      }
    };
    fetchTodays();
  }, []);

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

  // Fetch real alerts from the API
  const fetchAlerts = async () => {
    try {
      const alertsData = await getUnreadAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      toast({
        title: "Error fetching alerts",
        description: "Could not retrieve the latest alerts",
        variant: "destructive",
      });
    }
  };
  
  // Handle clearing a single alert
  const handleClearAlert = async (alertId: string) => {
    try {
      await markAsRead(alertId);
      setAlerts(alerts.filter(alert => alert._id !== alertId));
      toast({
        title: "Alert cleared",
        description: "The alert has been marked as read",
      });
    } catch (err) {
      console.error('Error clearing alert:', err);
      toast({
        title: "Error clearing alert",
        description: "Could not mark the alert as read",
        variant: "destructive",
      });
    }
  };
  
  // Handle clearing all alerts
  const handleClearAllAlerts = async () => {
    try {
      await markAllAsRead();
      setAlerts([]);
      toast({
        title: "All alerts cleared",
        description: "All alerts have been marked as read",
      });
    } catch (err) {
      console.error('Error clearing all alerts:', err);
      toast({
        title: "Error clearing alerts",
        description: "Could not mark all alerts as read",
        variant: "destructive",
      });
    }
  };

  // Always display all areas
  const filteredAreas = areas;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case AlertType.BIN_FILL_LEVEL: return <Trash2 className="h-5 w-5" />;
      case AlertType.AREA_FILL_LEVEL: return <Map className="h-5 w-5" />;
      case AlertType.MISSED_COLLECTION: return <Truck className="h-5 w-5" />;
      case AlertType.AUTO_SCHEDULE: return <CalendarClock className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case AlertSeverity.HIGH: return 'text-red-500 bg-red-100';
      case AlertSeverity.MEDIUM: return 'text-amber-500 bg-amber-100';
      case AlertSeverity.LOW: return 'text-blue-500 bg-blue-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  // Format relative time for alerts
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await axios.get<Issue[]>("http://localhost:5000/api/issue");
        setIssues(response.data);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch real data from the API with proper type assertion
      const response = await axios.get<DashboardMetrics>("http://localhost:5000/api/analytics/dashboard-metrics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });
      console.log('Analytics data:', response.data);
      setAnalytics({
        totalAreas: response.data.totalAreas,
        totalBins: response.data.totalBins,
        fillLevelTrendToday: response.data.fillLevelTrendToday,
        collectionsToday: response.data.collectionsToday
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      toast({
        title: "Error fetching analytics",
        description: "Could not retrieve the latest analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Fixed-height hero section instead of h-screen */}
      <section className="flex flex-col h-[900px] px-2 pt-2">
        {/* Fixed-height header section */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
            >
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                fetchAreas();
                fetchAlerts();
                fetchAnalytics();
              }}
              disabled={loading || areasLoading}
            >
              {(loading || areasLoading) ? (
                <RefreshCcw size={16} className="animate-spin mr-2" />
              ) : (
                <RefreshCcw size={16} className="mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 md:px-6 mb-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Areas</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.totalAreas}
                    </h4>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 text-purple-800 rounded-full">
                  <Map className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Bins</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.totalBins}
                    </h4>
                  </div>
                </div>
                <div className="p-2 bg-blue-100 text-blue-800 rounded-full">
                  <Trash2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fill Level Trend Today</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${analytics.fillLevelTrendToday}%`}
                    </h4>
                  </div>
                </div>
                <div className="p-2 bg-amber-100 text-amber-800 rounded-full">
                  <Percent className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Collections Today</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-bold">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics.collectionsToday}
                    </h4>
                  </div>
                </div>
                <div className="p-2 bg-green-100 text-green-800 rounded-full">
                  <Truck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map and Alerts container - now with fixed height */}
        <div className="flex-1 grid gap-4 px-4 pb-4 md:px-6 md:pb-6 md:grid-cols-3" style={{ height: '600px' }}>
          {/* Map card - takes 2/3 width on md+ screens */}
          <Card className="col-span-3 md:col-span-2 flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Map size={18} />
                Waste Collection Areas
                {selectedSuggestion && (
                  <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700">
                    Viewing Bin Suggestion
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Collection areas with bin locations and boundaries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 h-full">
              {areasLoading && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {areasError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-6">
                  {areasError}
                </div>
              )}

              {!areasLoading && !areasError && (
                <div className="flex-1 min-h-0 h-full">
                  <BinMap
                    areas={areas}
                    fitToAreas={true}
                    todaysRoutes={todaysRoutes}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time alerts container - takes 1/3 width on md+ screens */}
          <Card className="col-span-3 md:col-span-1 flex flex-col" style={{ height: "662px", maxHeight: "662px", overflowY: "auto" }}>
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" />
                  Real-time Alerts
                </CardTitle>
                <CardDescription>
                  System notifications and important updates
                </CardDescription>
              </div>
              {alerts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllAlerts}
                >
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No alerts at this time.</p>
                  </div>
                ) : alerts.map((alert) => (
                  <div
                    key={alert._id}
                    className={cn(
                      "flex items-start gap-4 rounded-md border p-3",
                      alert.severity === AlertSeverity.HIGH
                        ? "border-red-200 bg-red-50"
                        : alert.severity === AlertSeverity.MEDIUM
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full flex-shrink-0",
                      getAlertColor(alert.severity)
                    )}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="grid gap-1 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full -mt-1 -mr-1"
                          onClick={() => handleClearAlert(alert._id)}
                          title="Mark as read"
                        >
                          <span className="sr-only">Mark as read</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(alert.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Issues and Bin Suggestions - Below the hero section */}
      <section className="px-8 pb-8">
        <div className="space-y-6">
          {/* Issues and Bin Suggestions Grid */}
          <div className="grid gap-4 md:grid-cols-1">
            {/* Issues Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red-500" />
                  Reported Issues
                </CardTitle>
                <CardDescription>
                  A detailed list of reported issues in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {issuesLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading issues...</span>
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No issues reported.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {issues.map((issue) => (
                      <div
                        key={issue._id}
                        className="flex items-start gap-4 p-4 border rounded-md shadow-sm bg-white"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-500">
                          <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-800">
                            {issue.issueType}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {issue.description || "No description provided"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>Bin:</strong> {issue.bin?._id || "Unknown"} |{" "}
                            <strong>Reported At:</strong>{" "}
                            {new Date(issue.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>          
          </div>
        </div>
      </section>
    </div>
  );
}
