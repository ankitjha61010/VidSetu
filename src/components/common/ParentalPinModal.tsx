import React, { useState, useEffect } from 'react';
import { Lock, X, Check, ShieldAlert, KeyRound, Eye, EyeOff, ShieldOff } from 'lucide-react';

interface ParentalPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
  isPinEnabled: boolean;
  initialView?: 'unlock' | 'changePin' | 'removePin';
  onDisablePin: () => void;
  onEnablePin?: () => void;
  onUpdatePin: (newPin: string) => void;
}

type ModalView = 'unlock' | 'changePin' | 'removePin';

export const ParentalPinModal: React.FC<ParentalPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  isPinEnabled,
  initialView = 'unlock',
  onDisablePin,
  onEnablePin,
  onUpdatePin,
}) => {
  const [view, setView] = useState<ModalView>(initialView);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // For change PIN flow
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  
  // For remove PIN flow
  const [removeConfirmPin, setRemoveConfirmPin] = useState('');

  const [showPinText, setShowPinText] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setPin('');
      setError(null);
      setOldPin('');
      setNewPin('');
      setRemoveConfirmPin('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleVerifyUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPinEnabled || pin === currentPin) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handlePinChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 4);
    setPin(cleanVal);
    setError(null);
    if (cleanVal.length === 4) {
      if (!isPinEnabled || cleanVal === currentPin) {
        onSuccess();
      } else {
        setError('Incorrect PIN. Please try again.');
      }
    }
  };

  const handleConfirmRemove = (e: React.FormEvent) => {
    e.preventDefault();
    if (removeConfirmPin !== currentPin) {
      setError('Incorrect PIN. Cannot remove protection.');
      setRemoveConfirmPin('');
      return;
    }
    onDisablePin();
    onSuccess();
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPinEnabled && oldPin !== currentPin) {
      setError('Current PIN is incorrect.');
      setOldPin('');
      return;
    }
    if (newPin.length < 4) {
      setError('New PIN must be 4 digits.');
      return;
    }
    onUpdatePin(newPin);
    if (!isPinEnabled && onEnablePin) {
      onEnablePin();
    }
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. UNLOCK TO SWITCH VIEW */}
        {view === 'unlock' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Parental Lock</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Enter your 4-digit PIN to exit Kids Space and switch to normal streaming.
              </p>
            </div>

            <form onSubmit={handleVerifyUnlock} className="space-y-4">
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = pin[idx] || '';
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-2xl border flex items-center justify-center text-xl font-mono font-bold transition-all ${
                        error
                          ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                          : digit
                          ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-500/20'
                          : 'border-slate-800 bg-slate-950/60 text-slate-600'
                      }`}
                    >
                      {digit ? (showPinText ? digit : '•') : ''}
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="Type 4-digit PIN"
                  className="w-full text-center tracking-widest px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-base text-white font-mono placeholder:text-slate-600 placeholder:text-xs focus:outline-none focus:border-indigo-500/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPinText((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="text-center text-[11px] text-slate-500">
                Default PIN is <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">1234</code>
              </div>

              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                Unlock & Switch Space
              </button>
            </form>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                {isPinEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView('removePin');
                    }}
                    className="text-slate-400 hover:text-rose-400 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    Remove PIN Protection
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onEnablePin) onEnablePin();
                      setError(null);
                      setView('changePin');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Enable PIN Protection
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('changePin');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  {isPinEnabled ? 'Change PIN' : 'Set PIN'}
                </button>
              </div>
            </>
          )}

        {/* 2. REMOVE PIN CONFIRMATION (PROTECTED BY PIN) */}
        {view === 'removePin' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
                <ShieldOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Remove PIN Protection</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Please enter your current PIN to confirm removing parental lock protection.
              </p>
            </div>

            <form onSubmit={handleConfirmRemove} className="space-y-4">
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={removeConfirmPin}
                onChange={(e) => {
                  setRemoveConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setError(null);
                }}
                placeholder="Enter current 4-digit PIN"
                className="w-full text-center tracking-widest px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-base text-white font-mono placeholder:text-slate-600 placeholder:text-xs focus:outline-none focus:border-rose-500/60"
              />

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('unlock');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={removeConfirmPin.length < 4}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 disabled:opacity-40"
                >
                  Confirm Remove
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. CHANGE PIN VIEW (PROTECTED BY OLD PIN IF ENABLED) */}
        {view === 'changePin' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">{isPinEnabled ? 'Change Parental PIN' : 'Set Parental PIN'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPinEnabled ? 'Enter your current PIN and a new 4-digit PIN.' : 'Choose a 4-digit PIN to protect your Watch Space.'}
              </p>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-3">
              {isPinEnabled && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Current PIN</label>
                  <input
                    autoFocus
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={oldPin}
                    onChange={(e) => {
                      setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setError(null);
                    }}
                    placeholder="Enter current 4-digit PIN"
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">New PIN</label>
                <input
                  autoFocus={!isPinEnabled}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setError(null);
                  }}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(isPinEnabled && oldPin.length < 4) || newPin.length < 4}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-40"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

