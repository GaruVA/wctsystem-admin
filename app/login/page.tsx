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
      <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ShieldAlert size={32} className="text-black" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-black">WCTSystem Admin</CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-black">Username</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border-gray-200 focus:border-black focus:ring-black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-200 focus:border-black focus:ring-black"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/90 text-white"
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