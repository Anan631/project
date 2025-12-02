"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react'; // <-- تم تصحيح الاستيراد هنا
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EngineerSidebar from '@/components/engineer/EngineerSidebar';
import { cn } from '@/lib/utils';

// إنشاء سياق بسيط محلي لإدارة حالة الشريط الجانبي
interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggleSidebar: () => {},
});

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  // تحميل حالة الشريط الجانبي من التخزين المحلي عند التحميل الأولي
  useEffect(() => {
    const savedState = localStorage.getItem('engineerSidebarState');
    if (savedState !== null) {
      // استخدام القيمة مباشرة بدلاً من تحليل JSON
      setIsOpen(savedState === 'true' || savedState === 'open');
    }
  }, []);

  // حفظ حالة الشريط الجانبي في التخزين المحلي عند التغيير
  useEffect(() => {
    localStorage.setItem('engineerSidebarState', isOpen ? 'open' : 'closed');
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

function EngineerLayoutContent({ children }: { children: ReactNode }) {
  // استخدام السياق بشكل آمن
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-1 relative" dir="rtl">
        <EngineerSidebar isOpen={isOpen} onToggle={toggleSidebar} />
        
        {/* إضافة طبقة شبه شفافة للجوال عند فتح الشريط الجانبي */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
        
        <main
          className={cn(
            "flex-grow p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto transition-all duration-300 ease-in-out w-full"
          )}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function EngineerAppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <EngineerLayoutContent>{children}</EngineerLayoutContent>
    </SidebarProvider>
  );
}