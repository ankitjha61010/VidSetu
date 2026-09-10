import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { watchSpaceService } from '../services/watchSpaceService';
import { WatchSpace } from '../types';

const CURRENT_SPACE_KEY = 'vidsetu:currentWatchSpaceId';

interface WatchSpaceContextType {
  spaces: WatchSpace[];
  currentSpace: WatchSpace | null;
  isLoading: boolean;
  setCurrentSpaceId: (id: string) => void;
  createWatchSpace: (name: string) => Promise<WatchSpace>;
  refresh: () => Promise<void>;
}

const WatchSpaceContext = createContext<WatchSpaceContextType | undefined>(undefined);

export const WatchSpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<WatchSpace[]>([]);
  const [currentSpaceId, setCurrentSpaceIdState] = useState<string | null>(
    () => localStorage.getItem(CURRENT_SPACE_KEY)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const mySpaces = await watchSpaceService.listMySpaces(user.id);
      setSpaces(mySpaces);
      setCurrentSpaceIdState((prev) => {
        if (prev && mySpaces.some((s) => s.id === prev)) return prev;
        return mySpaces[0]?.id ?? null;
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setCurrentSpaceId = (id: string) => {
    setCurrentSpaceIdState(id);
    localStorage.setItem(CURRENT_SPACE_KEY, id);
  };

  const createWatchSpace = async (name: string): Promise<WatchSpace> => {
    if (!user) throw new Error('You must be signed in to create a Watch Space.');
    const space = await watchSpaceService.createWatchSpace(name, user.id);
    await refresh();
    setCurrentSpaceId(space.id);
    return space;
  };

  const currentSpace = spaces.find((s) => s.id === currentSpaceId) ?? null;

  return (
    <WatchSpaceContext.Provider
      value={{ spaces, currentSpace, isLoading, setCurrentSpaceId, createWatchSpace, refresh }}
    >
      {children}
    </WatchSpaceContext.Provider>
  );
};

export const useWatchSpace = (): WatchSpaceContextType => {
  const context = useContext(WatchSpaceContext);
  if (!context) throw new Error('useWatchSpace must be used within a WatchSpaceProvider');
  return context;
};
