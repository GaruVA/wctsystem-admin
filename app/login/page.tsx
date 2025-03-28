"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { ShieldAlert } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Replace with your actual base URL
});

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post<{ token: string }>('/admin/login', { username, password });
      const { token } = response.data;
      localStorage.setItem('adminToken', token);
      router.push('/dashboard');
    } catch (err: any) {
      // Handle specific errors based on status code
      if (err.response) {
        // Handle error response from server
        if (err.response.status === 404) {
          setError('The requested resource could not be found. Please check your credentials or contact support.');
        } else if (err.response.status === 500) {
          setError('Internal server error. Please try again later.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } else if (err.request) {
        // Handle error if no response was received
        setError('No response from the server. Please check your connection or try again later.');
      } else {
        // Handle other errors (e.g., network error)
        setError('An error occurred while making the request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center space-x-2">
            <ShieldAlert size={32} className="text-[#4285F4]" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-[#202124]">WCTSystem Admin</CardTitle>
          <CardDescription className="text-center text-[#202124]">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login to Admin Panel'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}