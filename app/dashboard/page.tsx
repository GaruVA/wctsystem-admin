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
  AlertTriangle
} from "lucide-react";
import { getAllAreasWithBins, AreaWithBins, Bin } from "@/lib/api/areas";
import { cn } from "@/lib/utils";
import { getUnreadAlerts, Alert, AlertSeverity, AlertType, markAsRead, markAllAsRead } from "@/lib/api/alerts";
import { toast } from "@/components/ui/use-toast";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

interface AnalyticsData {
  [areaId: string]: {
    utilization: number;
    collectionEfficiency: number;
    serviceDelay: number;
    bins: number;
    wasteTypeDistribution: Record<string, number>;
  };
}

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [areas, setAreas] = useState<AreaWithBins[]>([]);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [binSuggestions, setBinSuggestions] = useState<BinSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BinSuggestion | null>(null);
  const [suggestionBins, setSuggestionBins] = useState<Bin[]>([]); // New state for suggestion bins formatted for map

  useEffect(() => {
    fetchAreas();
    fetchAlerts();
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

  const handleBinSelect = (bin: Bin | null) => {
    setSelectedBin(bin);
  };

  const filteredAreas = selectedArea
    ? areas.filter(area => area.areaID === selectedArea)
    : areas;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case AlertType.BIN_FILL_LEVEL: return <Trash2 className="h-5 w-5" />;
      case AlertType.AREA_FILL_LEVEL: return <Map className="h-5 w-5" />;
      case AlertType.MISSED_COLLECTION: return <Truck className="h-5 w-5" />;
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

  // Create a Set of bin IDs that have issues for easy lookup
  const binsWithIssues = React.useMemo(() => {
    const issuesBinIds = new Set<string>();
    issues.forEach(issue => {
      if (issue.bin && issue.bin._id) {
        issuesBinIds.add(issue.bin._id);
      }
    });
    return issuesBinIds;
  }, [issues]);

  useEffect(() => {
    const fetchBinSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        const response = await axios.get<BinSuggestion[]>("http://localhost:5000/api/bin-suggestions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        setBinSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching bin suggestions:", error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchBinSuggestions();
  }, []);

  useEffect(() => {
    // Convert bin suggestions to map-compatible format when they're loaded
    if (binSuggestions.length > 0) {
      const formattedSuggestions = binSuggestions.map(suggestion => createSuggestionBin(suggestion));
      setSuggestionBins(formattedSuggestions);
    }
  }, [binSuggestions]);

  // Create suggestion bins for the map when a suggestion is selected
  const createSuggestionBin = (suggestion: BinSuggestion): any => {
    return {
      _id: suggestion._id,
      name: "Suggested Bin",
      binID: `suggestion-${suggestion._id}`,
      location: {
        type: "Point",
        coordinates: [suggestion.location.longitude, suggestion.location.latitude]
      },
      fillLevel: 0,
      wasteType: "GENERAL",
      status: "ACTIVE",
      lastEmptied: new Date().toISOString(),
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.createdAt,
      address: suggestion.address || "",
      isSuggestion: true,
      reason: suggestion.reason
    };
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/bin-suggestions/${suggestionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      
      // Remove the rejected suggestion from state
      setBinSuggestions(prev => prev.filter(suggestion => suggestion._id !== suggestionId));
      
      // Show success toast
      toast({
        title: "Suggestion rejected",
        description: "The bin suggestion has been removed.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error rejecting bin suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to reject bin suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Full-height hero section - 100vh */}
      <section className="flex flex-col h-screen px-2 pt-2">
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

        {/* Map and Alerts container - fills remaining height */}
        <div className="flex-1 grid gap-4 px-4 pb-4 md:px-6 md:pb-6 md:grid-cols-3">
          {/* Map card - takes 2/3 width on md+ screens */}
          <Card className="col-span-3 md:col-span-2 flex flex-col">
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
            <CardContent className="p-0 flex-1 min-h-0">
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
                <div className="flex flex-col h-full">
                  <div className="mb-4 flex flex-wrap gap-2 px-6 pt-2">
                    <button
                      onClick={() => setSelectedArea(null)}
                      className={`px-3 py-1 text-sm rounded ${selectedArea === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      All Areas ({areas.length})
                    </button>

                    {areas.map(area => (
                      <button
                        key={area.areaID}
                        onClick={() => setSelectedArea(area.areaID)}
                        className={`px-3 py-1 text-sm rounded ${selectedArea === area.areaID
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {area.areaName} ({area.bins.length})
                      </button>
                    ))}
                  </div>
                    <div className="flex-1 min-h-0">
                    <BinMap
                      areas={filteredAreas}
                      fitToAreas={!selectedSuggestion}
                      onBinSelect={handleBinSelect}
                      selectedBin={selectedBin}
                      style={{ height: "100%" }}
                      binsWithIssues={binsWithIssues}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time alerts container - takes 1/3 width on md+ screens */}
          <Card className="col-span-3 md:col-span-1 flex flex-col">
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
