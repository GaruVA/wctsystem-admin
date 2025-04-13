"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save, ArrowDownToLine, Settings } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [showSecrets, setShowSecrets] = useState({
    mongodb: false,
    jwt: false,
    ors: false
  });
  
  // Notification settings state
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [criticalThreshold, setCriticalThreshold] = useState(85);
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // System settings state
  const [systemName, setSystemName] = useState("WCT Waste Collection System");
  const [adminEmail, setAdminEmail] = useState("admin@wctsystem.com");
  
  // Bin settings state
  const [defaultBinCapacity, setDefaultBinCapacity] = useState("120");
  const [defaultCollectionFrequency, setDefaultCollectionFrequency] = useState("weekly");
  const [binAlerts, setBinAlerts] = useState(true);
  
  const saveSettings = () => {
    // Here you would send the settings to your backend API
    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span>General Settings</span>
            </CardTitle>
          <CardDescription>Configure your waste collection system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name</Label>
            <Input 
              id="system-name" 
              value={systemName} 
              onChange={(e) => setSystemName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input 
              id="admin-email" 
              type="email" 
              value={adminEmail} 
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between space-y-0 pt-2">
            <div>
              <Label htmlFor="enable-notifications" className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">Turn on/off all system notifications and alerts</p>
            </div>
            <Switch 
              id="enable-notifications" 
              checked={enableNotifications} 
              onCheckedChange={setEnableNotifications} 
            />
          </div>

          {/* Notification Settings - conditionally rendered */}
          {enableNotifications && (
            <div className="border p-4 rounded-md space-y-4 mt-4">

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Critical Fill Level Threshold</Label>
                  <span className="text-sm">{criticalThreshold}%</span>
                </div>
                <Slider 
                  value={[criticalThreshold]} 
                  max={100} 
                  step={5} 
                  onValueChange={(value) => setCriticalThreshold(value[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Warning Fill Level Threshold</Label>
                  <span className="text-sm">{warningThreshold}%</span>
                </div>
                <Slider 
                  value={[warningThreshold]} 
                  max={100} 
                  step={5} 
                  onValueChange={(value) => setWarningThreshold(value[0])} 
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <Label htmlFor="email-alerts">Email Alerts</Label>
                <Switch 
                  id="email-alerts" 
                  checked={emailAlerts} 
                  onCheckedChange={setEmailAlerts} 
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0">
                <Label htmlFor="sms-alerts">SMS Alerts</Label>
                <Switch 
                  id="sms-alerts" 
                  checked={smsAlerts}
                  onCheckedChange={setSmsAlerts} 
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={saveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}