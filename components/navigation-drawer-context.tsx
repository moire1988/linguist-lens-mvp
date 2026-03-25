"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface NavigationDrawerContextValue {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const NavigationDrawerContext =
  createContext<NavigationDrawerContextValue | null>(null);

export function NavigationDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((v) => !v);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,
      toggleDrawer,
      closeDrawer,
    }),
    [drawerOpen, toggleDrawer, closeDrawer]
  );

  return (
    <NavigationDrawerContext.Provider value={value}>
      {children}
    </NavigationDrawerContext.Provider>
  );
}

export function useNavigationDrawer(): NavigationDrawerContextValue {
  const ctx = useContext(NavigationDrawerContext);
  if (!ctx) {
    throw new Error(
      "useNavigationDrawer must be used within NavigationDrawerProvider"
    );
  }
  return ctx;
}
