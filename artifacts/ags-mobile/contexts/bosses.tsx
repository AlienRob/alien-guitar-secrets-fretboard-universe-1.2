/**
 * Tracks which bosses the player has beaten, persisted on-device.
 * Storage key: "ags-bosses-v1"
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "ags-bosses-v1";

interface BossesContextValue {
  loaded: boolean;
  beaten: Set<string>;
  beatBoss: (id: string) => Promise<void>;
  isBeaten: (id: string) => boolean;
}

const BossesContext = createContext<BossesContextValue | undefined>(undefined);

export function BossesProvider({ children }: { children: React.ReactNode }) {
  const [beaten, setBeaten] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBeaten(new Set(JSON.parse(raw) as string[]));
      } catch {
        // start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const beatBoss = useCallback(async (id: string) => {
    setBeaten((prev) => {
      const next = new Set(prev);
      next.add(id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const isBeaten = useCallback((id: string) => beaten.has(id), [beaten]);

  return (
    <BossesContext.Provider value={{ loaded, beaten, beatBoss, isBeaten }}>
      {children}
    </BossesContext.Provider>
  );
}

export function useBosses(): BossesContextValue {
  const ctx = useContext(BossesContext);
  if (!ctx) throw new Error("useBosses must be used within BossesProvider");
  return ctx;
}
