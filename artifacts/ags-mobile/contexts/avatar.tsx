import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { type AvatarConfig, DEFAULT_AVATAR } from "@/lib/avatarOptions";

interface AvatarContextValue {
  loaded: boolean;
  avatar: AvatarConfig;
  update: (patch: Partial<AvatarConfig>) => Promise<void>;
  reset: () => Promise<void>;
}

const STORAGE_KEY = "ags-avatar-v4";

const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setAvatar({ ...DEFAULT_AVATAR, ...JSON.parse(raw) });
      } catch {
        // start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next: AvatarConfig) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const update = async (patch: Partial<AvatarConfig>) => {
    const next = { ...avatar, ...patch };
    setAvatar(next);
    await persist(next);
  };

  const reset = async () => {
    setAvatar(DEFAULT_AVATAR);
    await persist(DEFAULT_AVATAR);
  };

  return (
    <AvatarContext.Provider value={{ loaded, avatar, update, reset }}>
      {children}
    </AvatarContext.Provider>
  );
}

export function useAvatar(): AvatarContextValue {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error("useAvatar must be used within AvatarProvider");
  return ctx;
}
