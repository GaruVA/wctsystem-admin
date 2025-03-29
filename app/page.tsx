import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard
  redirect('/dashboard');
  
  // This part will not be executed due to the redirect
  return null;
}