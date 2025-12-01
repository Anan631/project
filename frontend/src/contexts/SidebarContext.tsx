"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    console.warn('useSidebar must be used within a SidebarProvider, returning default values');
    return {
      isOpen: true,
      toggleSidebar: () => {
        const currentState = localStorage.getItem('engineerSidebarState') === 'open';
        const newState = !currentState;
        localStorage.setItem('engineerSidebarState', newState ? 'open' : 'closed');
        
        // إرسال حدث لتحديث الشريط الجانبي
        window.dispatchEvent(new CustomEvent('sidebar-state-changed', { detail: { isOpen: newState } }));
      }
    };
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('engineerSidebarState');
      
      // التأكد من أن الشريط الجانبي يعمل عند تحميل الصفحة
      if (savedState === null) {
        localStorage.setItem('engineerSidebarState', 'open');
        setIsOpen(true);
      } else {
        setIsOpen(savedState === 'open');
      }
      
      // إضافة مستمع لأحداث التبديل من أي مكان في التطبيق
      const handleToggleRequest = () => {
        console.log('استلام طلب تبديل الشريط الجانبي');
        setIsOpen(prev => !prev);
      };
      
      window.addEventListener('toggle-sidebar-request', handleToggleRequest);
      
      return () => {
        window.removeEventListener('toggle-sidebar-request', handleToggleRequest);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('engineerSidebarState', isOpen ? 'open' : 'closed');
    }
  }, [isOpen]);

  const toggleSidebar = () => {
    console.log('تبديل الشريط الجانبي من:', isOpen, 'إلى:', !isOpen);
    setIsOpen(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}
