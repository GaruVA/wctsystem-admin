import React from 'react';
import MainLayout from '@/components/layout/main-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}