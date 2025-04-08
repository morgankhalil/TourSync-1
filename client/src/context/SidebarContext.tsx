import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMobile } from '@/hooks/use-mobile';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar by default on mobile, open by default on desktop
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);
  
  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  const value = {
    isOpen,
    toggle,
    open,
    close
  };
  
  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
}