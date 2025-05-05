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
  BarChart4,
  CheckCircle2,
  ImageIcon,
  Clock,
  RotateCcw
} from "lucide-react";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";
import { getAllSchedules, Schedule } from "@/lib/api/schedules";
import { cn } from "@/lib/utils";
import { getUnreadAlerts, Alert, AlertSeverity, AlertType, markAsRead, markAllAsRead } from "@/lib/api/alerts";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Issue, getAllIssues, updateIssueStatus } from "@/lib/api/issues";
import { Switch } from "@/components/ui/switch";



// Interface for bin suggestion
interface BinSuggestion {
  _id: string;
  reason: string;
  location: {
    longitude: number;
    latitude: number;
  };
  address?: string;
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
  const [updatingIssue, setUpdatingIssue] = useState<string | null>(null);
  const [binSuggestions, setBinSuggestions] = useState<BinSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BinSuggestion | null>(null);
  const [suggestionBins, setSuggestionBins] = useState<Bin[]>([]);
  const [selectedIssueImage, setSelectedIssueImage] = useState<string | null>(null);
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
    fetchIssues();
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

  // Fetch issues with our new API function
  const fetchIssues = async () => {
    try {
      setIssuesLoading(true);
      const issuesData = await getAllIssues();
      setIssues(issuesData);
    } catch (err) {
      console.error('Error fetching issues:', err);
      toast({
        title: "Error fetching issues",
        description: "Could not retrieve the latest issues",
        variant: "destructive",
      });
    } finally {
      setIssuesLoading(false);
    }
  };

  // Handle updating issue status
  const handleIssueStatusChange = async (issueId: string, newStatus: 'pending' | 'resolved') => {
    try {
      setUpdatingIssue(issueId);
      const updatedIssue = await updateIssueStatus(issueId, newStatus);
      
      // Update the local state with the updated issue
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue._id === issueId ? { ...issue, status: updatedIssue.status } : issue
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Issue has been marked as ${newStatus}`,
      });
    } catch (err) {
      console.error('Error updating issue status:', err);
      toast({
        title: "Error updating status",
        description: "Failed to update issue status",
        variant: "destructive",
      });
    } finally {
      setUpdatingIssue(null);
    }
  };

  // Show image in modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedIssueImage(imageUrl);
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
                fetchIssues();
              }}
              disabled={loading || areasLoading || issuesLoading}
            >
              {(loading || areasLoading || issuesLoading) ? (
                <RefreshCcw size={16} className="animate-spin mr-2" />
              ) : (
                <RefreshCcw size={16} className="mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* Stats cards - keeping the existing code */}
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

        {/* Map and Alerts container - keeping the existing code */}
        <div className="flex-1 grid gap-4 px-4 pb-4 md:px-6 md:pb-6 md:grid-cols-3" style={{ height: '600px' }}>
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
            {/* Issues Section - Updated with enhanced display and status toggle */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    Reported Issues
                  </CardTitle>
                  <CardDescription>
                    A detailed list of reported issues in the system. Toggle between pending and resolved states.
                  </CardDescription>
                </div>
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
                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {issues.map((issue) => (
                      <div
                        key={issue._id}
                        className="flex flex-col gap-4 p-4 border rounded-md shadow-sm bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full",
                            issue.status === 'resolved' ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
                          )}>
                            {issue.status === 'resolved' ? 
                              <CheckCircle2 size={20} /> : 
                              <AlertTriangle size={20} />
                            }
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-600 mt-2">
                                {issue.description || "No description provided"}
                              </p>
                              <Badge variant={issue.status === 'resolved' ? "outline" : "destructive"} className={cn(
                                issue.status === 'resolved' ? "border-green-200 bg-green-50 text-green-700" : ""
                              )}>
                                {issue.status === 'resolved' ? 'Resolved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Image thumbnails - if available */}
                        {issue.images && issue.images.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                              <ImageIcon size={12} />
                              Attached Images:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {issue.images.map((image, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-16 h-16 rounded-md border overflow-hidden cursor-pointer"
                                  onClick={() => handleImageClick(image)}
                                >
                                  <img
                                    src={image}
                                    alt={`Issue ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with metadata and action */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                          <div className="flex items-center text-xs text-gray-500 gap-4">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>Reported: {formatRelativeTime(issue.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {issue.status === 'pending' ? 'Mark as resolved:' : 'Mark as pending:'}
                            </span>
                            <div className="relative">
                              {updatingIssue === issue._id && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-full">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                </div>
                              )}
                              <Switch 
                                checked={issue.status === 'resolved'}
                                onCheckedChange={(checked) => {
                                  handleIssueStatusChange(issue._id, checked ? 'resolved' : 'pending');
                                }}
                                disabled={updatingIssue === issue._id}
                              />
                            </div>
                          </div>
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

      {/* Modal for viewing full images */}
      {selectedIssueImage && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setSelectedIssueImage(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] p-2 bg-white rounded-lg">
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/80 rounded-full"
              onClick={() => setSelectedIssueImage(null)}
            >
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
            <img 
              src={selectedIssueImage} 
              alt="Issue detail" 
              className="max-w-full max-h-[calc(80vh-2rem)] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
