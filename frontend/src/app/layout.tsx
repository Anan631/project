import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppProviders from '@/components/AppProviders';
import InitialLoader from '@/components/loading/InitialLoader';

export const metadata: Metadata = {
  title: 'المحترف لحساب الكميات',
  description: 'تطبيق لحساب كميات مواد البناء وتتبع تقدم المشاريع الإنشائية',
  icons: {
    icon: '/header-bg.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-body antialiased" style={{ fontFamily: "'Almarai', 'Times New Roman', serif" }}>
        <AppProviders>
          <InitialLoader>{children}</InitialLoader>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
