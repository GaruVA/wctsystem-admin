"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Truck, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.22:5000/api', // Replace with your actual base URL
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await api.post<{ token: string }>('/auth/login', { email, password });
      const token = response.data.token;
      localStorage.setItem('token', token);
      router.push(`/dashboard?token=${token}`);
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <Truck size={32} className="text-[#34A853]" />
            <ShieldAlert size={32} className="text-[#4285F4]" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#202124]">WCTSystem Admin</CardTitle>
          <CardDescription className="text-center text-[#202124]">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@wctsystem.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#4285F4]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-[#4285F4]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-[#34A853] hover:bg-[#2D9047] text-white"
            >
              Login to Admin Panel
            </Button>
          </CardFooter>
        </form>
        <div className="text-center pb-4">
          <a href="/forgot-password" className="text-sm text-[#4285F4] hover:underline">Forgot password?</a>
        </div>
      </Card>
    </div>
  );
}