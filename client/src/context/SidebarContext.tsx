
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMobile } from '@/hooks/use-mobile';

type SidebarContext = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContext | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);
  
  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  
  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggle,
      open,
      close,
      isMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
