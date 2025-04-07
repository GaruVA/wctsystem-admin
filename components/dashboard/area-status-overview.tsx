'use client';

import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Trash2, Recycle, Leaf, AlertOctagon, MapPin } from 'lucide-react';
import axios from 'axios';

interface AreaStatus {
  _id: string;
  name: string;
  binCount: number;
  averageFillLevel: number;
  criticalBins: number;
  wasteTypeCounts: Record<string, number>;
  activeCollectors: number;
  scheduledCollections: number;
  status: 'critical' | 'warning' | 'normal';
  lastCollection?: string;
  nextScheduled?: string;
}

const api = axios.create({
  baseURL: "http://localhost:5000/api", 
});

export function AreaStatusOverview() {
  const [areaStatuses, setAreaStatuses] = useState<AreaStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAreaStatus = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/analytics/area-status", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        // Fix the type safety issue with proper type assertion
        setAreaStatuses(response.data as AreaStatus[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching area status data:', err);
        setError('Failed to load area status data');
        
        // Mock data for development
        setAreaStatuses([
          {
            _id: 'area1',
            name: 'Zone 1',
            binCount: 15,
            averageFillLevel: 85,
            criticalBins: 4,
            wasteTypeCounts: {
              GENERAL: 6,
              ORGANIC: 4,
              RECYCLE: 3,
              HAZARDOUS: 2
            },
            activeCollectors: 2,
            scheduledCollections: 3,
            status: 'critical',
            lastCollection: '2h ago',
            nextScheduled: 'Today, 4PM'
          },
          {
            _id: 'area2',
            name: 'Zone 2',
            binCount: 21,
            averageFillLevel: 65,
            criticalBins: 7,
            wasteTypeCounts: {
              GENERAL: 8,
              ORGANIC: 5,
              RECYCLE: 6,
              HAZARDOUS: 2
            },
            activeCollectors: 1,
            scheduledCollections: 2,
            status: 'warning',
            lastCollection: '3h ago',
            nextScheduled: 'Today, 5PM'
          },
          {
            _id: 'area3',
            name: 'Zone 3',
            binCount: 18,
            averageFillLevel: 48,
            criticalBins: 1,
            wasteTypeCounts: {
              GENERAL: 7,
              ORGANIC: 5,
              RECYCLE: 4,
              HAZARDOUS: 2
            },
            activeCollectors: 3,
            scheduledCollections: 1,
            status: 'normal',
            lastCollection: '1h ago',
            nextScheduled: 'Tomorrow, 9AM'
          },
          {
            _id: 'area4',
            name: 'Zone 4',
            binCount: 12,
            averageFillLevel: 40,
            criticalBins: 0,
            wasteTypeCounts: {
              GENERAL: 5,
              ORGANIC: 4,
              RECYCLE: 2,
              HAZARDOUS: 1
            },
            activeCollectors: 2,
            scheduledCollections: 1,
            status: 'normal',
            lastCollection: '4h ago',
            nextScheduled: 'Tomorrow, 10AM'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAreaStatus();
    // Refresh area status data every 5 minutes
    const intervalId = setInterval(fetchAreaStatus, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Get badge color based on fill level
  const getBadgeColor = (fillLevel: number) => {
    if (fillLevel > 80) {
      return 'bg-red-100 text-red-800';
    } else if (fillLevel > 60) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Status Overview</CardTitle>
          <CardDescription>Current collection status by area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(index => (
              <div key={index} className="rounded-lg border p-3 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/4"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-full mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && areaStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Area Status Overview</CardTitle>
          <CardDescription>Current collection status by area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Status Overview</CardTitle>
        <CardDescription>Current collection status by area</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {areaStatuses.map((area) => {
            const badgeColor = getBadgeColor(area.averageFillLevel);
            
            return (
              <div key={area._id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{area.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={badgeColor}
                  >
                    {Math.round(area.averageFillLevel)}% Avg
                  </Badge>
                </div>
                
                <Progress value={area.averageFillLevel} className="mt-2 h-2" />
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Total Bins</p>
                    <p className="font-medium">{area.binCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Critical</p>
                    <p className={`font-medium ${area.criticalBins > 0 ? 'text-red-600' : ''}`}>
                      {area.criticalBins}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Collection</p>
                    <p className="font-medium">{area.lastCollection || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Scheduled</p>
                    <p className="font-medium">{area.nextScheduled || 'N/A'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}