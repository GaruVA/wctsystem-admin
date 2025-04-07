"use client"

import MainLayout from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Upload } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [showSecrets, setShowSecrets] = useState({
    mongodb: false,
    jwt: false,
    ors: false
  });

  return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="collection">Area Configuration</TabsTrigger>
            <TabsTrigger value="alerts">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure your waste collection system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input id="system-name" defaultValue="WCT Waste Collection System" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Organization Name</Label>
                  <Input id="organization-name" defaultValue="City Waste Management Department" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@wctsystem.com" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <Switch id="notifications" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="collection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Settings</CardTitle>
                <CardDescription>Configure waste collection zones and collection parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Bins Per Route</Label>
                  <Select defaultValue="20">
                    <SelectTrigger>
                      <SelectValue placeholder="Select maximum bins per route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Bins</SelectItem>
                      <SelectItem value="15">15 Bins</SelectItem>
                      <SelectItem value="20">20 Bins</SelectItem>
                      <SelectItem value="25">25 Bins</SelectItem>
                      <SelectItem value="30">30 Bins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Collection Start Time</Label>
                  <Input type="time" defaultValue="08:00" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Capacity (kg)</Label>
                  <Input type="number" defaultValue="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Service Time Per Bin (minutes)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="weekend-collection">Enable Weekend Collections</Label>
                  <Switch id="weekend-collection" />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="automatic-scheduling">Automatic Route Scheduling</Label>
                  <Switch id="automatic-scheduling" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Collection Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Settings</CardTitle>
                <CardDescription>Configure bin fill level thresholds and notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Critical Fill Level Threshold</Label>
                    <span className="text-sm">85%</span>
                  </div>
                  <Slider defaultValue={[85]} max={100} step={5} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Warning Fill Level Threshold</Label>
                    <span className="text-sm">70%</span>
                  </div>
                  <Slider defaultValue={[70]} max={100} step={5} />
                </div>
                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <Switch id="email-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="sms-alerts">SMS Alerts</Label>
                  <Switch id="sms-alerts" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Alert Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>Configure API keys and database connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mongodb-uri">MongoDB URI</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, mongodb: !showSecrets.mongodb})}
                    >
                      {showSecrets.mongodb ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="mongodb-uri" 
                    type={showSecrets.mongodb ? "text" : "password"}
                    defaultValue="mongodb+srv://garukaassalaarachchi:RJL8J7ZEnsNzycnt@db.fbree.mongodb.net/wctsystem?retryWrites=true&w=majority&appName=DB" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="jwt-secret">JWT Secret</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, jwt: !showSecrets.jwt})}
                    >
                      {showSecrets.jwt ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="jwt-secret" 
                    type={showSecrets.jwt ? "text" : "password"}
                    defaultValue="H9igabBAKjzwJoXzepsNHfXo4DAOEvXzSPa-jLq9YUc" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ors-api-key">OpenRouteService API Key</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowSecrets({...showSecrets, ors: !showSecrets.ors})}
                    >
                      {showSecrets.ors ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <Input 
                    id="ors-api-key" 
                    type={showSecrets.ors ? "text" : "password"}
                    defaultValue="5b3ce3597851110001cf62489d3650ef4f0f47a9b852b45571dc18ed" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backend-port">Backend Port</Label>
                  <Input id="backend-port" type="number" defaultValue="5000" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These API keys and secrets should be kept confidential. 
                  Only authorized personnel should have access to this page.
                </div>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save API Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        
        </Tabs>
      </div>
  )
}