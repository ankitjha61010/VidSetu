import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { watchSpaceService } from '../services/watchSpaceService';
import { WatchSpace } from '../types';
import { ParentalPinModal } from '../components/common/ParentalPinModal';

const CURRENT_SPACE_KEY = 'vidsetu:currentWatchSpaceId';
const PARENTAL_PIN_KEY = 'vidsetu:parentalPin';
const PARENTAL_PIN_ENABLED_KEY = 'vidsetu:parentalPinEnabled';

interface WatchSpaceContextType {
  spaces: WatchSpace[];
  currentSpace: WatchSpace | null;
  isKidsSpace: boolean;
  isLoading: boolean;
  isParentalPinEnabled: boolean;
  parentalPin: string;
  setCurrentSpaceId: (id: string) => void;
  requestSpaceSwitch: (id: string) => void;
  createWatchSpace: (name: string, isKids?: boolean) => Promise<WatchSpace>;
  updateParentalPin: (pin: string) => void;
  disableParentalPin: () => void;
  enableParentalPin: () => void;
  openParentalPinModal: (mode?: 'unlock' | 'changePin' | 'removePin') => void;
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

  // Parental PIN control state
  const [parentalPin, setParentalPinState] = useState<string>(() => {
    return localStorage.getItem(PARENTAL_PIN_KEY) || '1234';
  });
  const [isParentalPinEnabled, setIsParentalPinEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(PARENTAL_PIN_ENABLED_KEY);
    return saved !== null ? saved === 'true' : false;
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalInitialView, setPinModalInitialView] = useState<'unlock' | 'changePin' | 'removePin'>('unlock');
  const [pendingTargetSpaceId, setPendingTargetSpaceId] = useState<string | null>(null);

  const updateParentalPin = (pin: string) => {
    setParentalPinState(pin);
    localStorage.setItem(PARENTAL_PIN_KEY, pin);
  };

  const disableParentalPin = () => {
    setIsParentalPinEnabledState(false);
    localStorage.setItem(PARENTAL_PIN_ENABLED_KEY, 'false');
  };

  const enableParentalPin = () => {
    setIsParentalPinEnabledState(true);
    localStorage.setItem(PARENTAL_PIN_ENABLED_KEY, 'true');
  };

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

  const currentSpace = spaces.find((s) => s.id === currentSpaceId) ?? null;
  const isKidsSpace = Boolean(currentSpace?.isKids);

  const requestSpaceSwitch = (targetSpaceId: string) => {
    if (targetSpaceId === currentSpaceId) return;

    const targetSpace = spaces.find((s) => s.id === targetSpaceId);
    
    // Check if switching OUT of a Kids Space into a non-Kids space
    if (currentSpace?.isKids && !targetSpace?.isKids && isParentalPinEnabled) {
      setPendingTargetSpaceId(targetSpaceId);
      setPinModalInitialView('unlock');
      setIsPinModalOpen(true);
      return;
    }

    // Otherwise switch immediately
    setCurrentSpaceId(targetSpaceId);
  };

  const handlePinSuccess = () => {
    if (pendingTargetSpaceId) {
      setCurrentSpaceId(pendingTargetSpaceId);
      setPendingTargetSpaceId(null);
    }
    setIsPinModalOpen(false);
  };

  const createWatchSpace = async (name: string, isKids: boolean = false): Promise<WatchSpace> => {
    if (!user) throw new Error('You must be signed in to create a Watch Space.');
    const space = await watchSpaceService.createWatchSpace(name, user.id, isKids);
    await refresh();
    setCurrentSpaceId(space.id);
    return space;
  };

  const openParentalPinModal = (mode: 'unlock' | 'changePin' | 'removePin' = 'changePin') => {
    setPendingTargetSpaceId(null);
    setPinModalInitialView(mode);
    setIsPinModalOpen(true);
  };

  return (
    <WatchSpaceContext.Provider
      value={{
        spaces,
        currentSpace,
        isKidsSpace,
        isLoading,
        isParentalPinEnabled,
        parentalPin,
        setCurrentSpaceId,
        requestSpaceSwitch,
        createWatchSpace,
        updateParentalPin,
        disableParentalPin,
        enableParentalPin,
        openParentalPinModal,
        refresh,
      }}
    >
      {children}

      <ParentalPinModal
        isOpen={isPinModalOpen}
        initialView={pinModalInitialView}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingTargetSpaceId(null);
        }}
        onSuccess={handlePinSuccess}
        currentPin={parentalPin}
        isPinEnabled={isParentalPinEnabled}
        onDisablePin={disableParentalPin}
        onEnablePin={enableParentalPin}
        onUpdatePin={updateParentalPin}
      />
    </WatchSpaceContext.Provider>
  );
};

export const useWatchSpace = (): WatchSpaceContextType => {
  const context = useContext(WatchSpaceContext);
  if (!context) throw new Error('useWatchSpace must be used within a WatchSpaceProvider');
  return context;
};

