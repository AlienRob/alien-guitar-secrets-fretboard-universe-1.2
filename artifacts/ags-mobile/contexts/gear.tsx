/**
 * Gear inventory context — persists collected gear items and guardian progress.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { DrillType } from "@/lib/drills";
import {
  type GearItem,
  type GuardianBelt,
  type GuardianProgress,
  STARTER_GEAR_IDS,
  computeGuardianBelt,
  gearById,
} from "@/lib/gear";

const STORAGE_KEY = "ags-gear-v1";

interface GearState {
  ownedIds: string[];
  guardianProgress: GuardianProgress;
}

const EMPTY_GUARDIAN_PROGRESS: GuardianProgress = {
  drillCounts: {},
  accuracies: {},
  practiceMinutes: 0,
};

const DEFAULT_STATE: GearState = {
  ownedIds: STARTER_GEAR_IDS,
  guardianProgress: EMPTY_GUARDIAN_PROGRESS,
};

interface GearContextValue {
  loaded: boolean;
  ownedIds: string[];
  owns: (id: string) => boolean;
  ownedItems: GearItem[];
  guardianProgress: GuardianProgress;
  guardianBelt: GuardianBelt;
  addItems: (items: GearItem[]) => Promise<void>;
  recordDrillForGuardian: (type: DrillType, correct: number, total: number, minutes: number) => Promise<void>;
  reset: () => Promise<void>;
}

const GearContext = createContext<GearContextValue | undefined>(undefined);

export function GearProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GearState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<GearState>;
          // always ensure all starter items are present (survives app updates)
          const merged = Array.from(new Set([...STARTER_GEAR_IDS, ...(parsed.ownedIds ?? [])]));
          setState({
            ownedIds: merged,
            guardianProgress: parsed.guardianProgress ?? EMPTY_GUARDIAN_PROGRESS,
          });
        }
      } catch {
        // start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next: GearState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // non-fatal
    }
  };

  const addItems = async (items: GearItem[]) => {
    setState((prev) => {
      const existing = new Set(prev.ownedIds);
      const newIds = items.map((i) => i.id).filter((id) => !existing.has(id));
      if (newIds.length === 0) return prev;
      const next = { ...prev, ownedIds: [...prev.ownedIds, ...newIds] };
      persist(next);
      return next;
    });
  };

  const recordDrillForGuardian = async (
    type: DrillType,
    correct: number,
    total: number,
    minutes: number,
  ) => {
    setState((prev) => {
      const gp = prev.guardianProgress;
      const prevCount = gp.drillCounts[type] ?? 0;
      const prevAcc = gp.accuracies[type] ?? 0;
      const thisAcc = total > 0 ? Math.round((correct / total) * 100) : 0;
      const next: GearState = {
        ...prev,
        guardianProgress: {
          drillCounts: { ...gp.drillCounts, [type]: prevCount + 1 },
          accuracies: { ...gp.accuracies, [type]: Math.max(prevAcc, thisAcc) },
          practiceMinutes: gp.practiceMinutes + minutes,
        },
      };
      persist(next);
      return next;
    });
  };

  const reset = async () => {
    setState(DEFAULT_STATE);
    await persist(DEFAULT_STATE);
  };

  const owns = (id: string) => state.ownedIds.includes(id);

  const ownedItems: GearItem[] = state.ownedIds
    .map((id) => gearById(id))
    .filter((g): g is GearItem => g !== undefined);

  const value: GearContextValue = {
    loaded,
    ownedIds: state.ownedIds,
    owns,
    ownedItems,
    guardianProgress: state.guardianProgress,
    guardianBelt: computeGuardianBelt(state.guardianProgress),
    addItems,
    recordDrillForGuardian,
    reset,
  };

  return <GearContext.Provider value={value}>{children}</GearContext.Provider>;
}

export function useGear(): GearContextValue {
  const ctx = useContext(GearContext);
  if (!ctx) throw new Error("useGear must be used within GearProvider");
  return ctx;
}
