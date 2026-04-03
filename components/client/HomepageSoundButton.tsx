"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Volume1,
  Volume2,
  VolumeX,
  Waves,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const AUDIO_SRC = "/audio/music.mp3";
const CONSENT_KEY = "teleport-audio-consent";
const MUTED_KEY = "teleport-audio-muted";
const VOLUME_KEY = "teleport-audio-volume";
const DEFAULT_VOLUME = 0.25;

type ConsentState = "granted" | "muted" | null;
type PlaybackReason = "initial" | "interaction" | "visibility" | "state";

let backgroundAudio: HTMLAudioElement | null = null;

function clampVolume(value: number) {
  if (Number.isNaN(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
}

function parseStoredVolume(rawValue: string | null) {
  if (!rawValue) return DEFAULT_VOLUME;
  const parsed = Number(rawValue);
  return clampVolume(parsed);
}

function parseStoredMuted(rawValue: string | null) {
  return rawValue === "true";
}

function parseStoredConsent(rawValue: string | null): ConsentState {
  if (rawValue === "granted" || rawValue === "muted") {
    return rawValue;
  }
  return null;
}

function getBackgroundAudio() {
  if (typeof window === "undefined") return null;

  if (!backgroundAudio) {
    backgroundAudio = new Audio(AUDIO_SRC);
    backgroundAudio.loop = true;
    backgroundAudio.preload = "none";
    backgroundAudio.setAttribute("playsinline", "true");
  }

  return backgroundAudio;
}

export function HomepageSoundButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const consentRef = useRef<ConsentState>(null);
  const mutedRef = useRef(true);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const syncPlayback = useCallback(async (reason: PlaybackReason) => {
    const audio = getBackgroundAudio();
    if (!audio) return;

    const currentConsent = consentRef.current;
    const currentMuted = mutedRef.current;
    const currentVolume = clampVolume(volumeRef.current);

    audio.preload = currentConsent === "granted" ? "auto" : "none";
    audio.volume = currentMuted ? 0 : currentVolume;

    if (currentConsent !== "granted" || currentMuted) {
      audio.pause();
      return;
    }

    if (
      reason !== "interaction" &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      return;
    }

    if (!audio.paused) return;

    try {
      await audio.play();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Background audio playback was blocked.", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedConsent = parseStoredConsent(
      window.localStorage.getItem(CONSENT_KEY),
    );
    const storedVolume = parseStoredVolume(
      window.localStorage.getItem(VOLUME_KEY),
    );
    const storedMuted = parseStoredMuted(
      window.localStorage.getItem(MUTED_KEY),
    );
    let nextMuted = true;
    if (storedConsent === "granted") {
      nextMuted = storedMuted;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(storedConsent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVolume(storedVolume);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMuted(nextMuted);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowConsentDialog(!storedConsent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    consentRef.current = storedConsent;
    volumeRef.current = storedVolume;
    mutedRef.current = nextMuted;

    if (storedConsent) {
      void syncPlayback("initial");
    }

    return () => {
      if (backgroundAudio) {
        backgroundAudio.pause();
      }
    };
  }, [syncPlayback]);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const handlePointerDown = () => {
      void syncPlayback("interaction");
    };

    const handleKeyDown = () => {
      void syncPlayback("interaction");
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void syncPlayback("visibility");
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMounted, syncPlayback]);

  const persistConsent = (nextConsent: Exclude<ConsentState, null>) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CONSENT_KEY, nextConsent);
  };

  const persistMuted = (nextMuted: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MUTED_KEY, String(nextMuted));
  };

  const persistVolume = (nextVolume: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VOLUME_KEY, String(nextVolume));
  };

  const handleEnableSound = async () => {
    const nextConsent: Exclude<ConsentState, null> = "granted";

    setConsent(nextConsent);
    setIsMuted(false);
    setShowConsentDialog(false);
    setIsExpanded(true);

    consentRef.current = nextConsent;
    mutedRef.current = false;

    persistConsent(nextConsent);
    persistMuted(false);
    persistVolume(volumeRef.current);

    await syncPlayback("interaction");
  };

  const handleKeepMuted = () => {
    const nextConsent: Exclude<ConsentState, null> = "muted";

    setConsent(nextConsent);
    setIsMuted(true);
    setShowConsentDialog(false);

    consentRef.current = nextConsent;
    mutedRef.current = true;

    persistConsent(nextConsent);
    persistMuted(true);
    persistVolume(volumeRef.current);

    void syncPlayback("state");
  };

  const handleMuteToggle = async () => {
    if (!consentRef.current) {
      setShowConsentDialog(true);
      return;
    }

    const nextMuted = !mutedRef.current;
    const nextConsent = nextMuted ? consentRef.current : "granted";

    setIsMuted(nextMuted);
    setConsent(nextConsent);

    mutedRef.current = nextMuted;
    consentRef.current = nextConsent;

    persistMuted(nextMuted);
    persistConsent(nextConsent);

    await syncPlayback(nextMuted ? "state" : "interaction");
  };

  const handleVolumeChange = async (values: number[]) => {
    const sliderValue = values[0] ?? DEFAULT_VOLUME * 100;
    const nextVolume = clampVolume(sliderValue / 100);

    setVolume(nextVolume);
    volumeRef.current = nextVolume;
    persistVolume(nextVolume);

    const audio = getBackgroundAudio();
    if (audio) {
      audio.volume = mutedRef.current ? 0 : nextVolume;
    }

    if (!mutedRef.current && consentRef.current === "granted") {
      await syncPlayback("interaction");
    }
  };

  if (!isMounted) return null;

  const VolumeIcon = isMuted ? VolumeX : volume <= 0.5 ? Volume1 : Volume2;

  return (
    <>
      <Dialog
        open={showConsentDialog}
        onOpenChange={(open) => {
          if (open) {
            setShowConsentDialog(true);
          }
        }}
      >
        <DialogContent
          className="max-w-[360px] rounded-[28px] border-white/20 bg-white/90 p-0 shadow-2xl backdrop-blur-xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="p-5">
            <DialogHeader className="items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg">
                <Waves className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black text-slate-900">
                Homepage Sound
              </DialogTitle>
              <DialogDescription className="max-w-[260px] text-sm leading-relaxed text-slate-500">
                Enable background music for a richer home page experience, or
                keep it muted and decide later from the sound button.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl font-bold"
                onClick={handleKeepMuted}
              >
                Keep Muted
              </Button>
              <Button
                type="button"
                className="h-11 rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800"
                onClick={() => {
                  void handleEnableSound();
                }}
              >
                Enable Sound
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6">
        <div className="group pointer-events-auto flex items-center justify-end gap-2">
          <div
            className={cn(
              "flex items-center overflow-hidden rounded-full border border-white/30 bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300",
              isExpanded
                ? "max-w-[220px] opacity-100"
                : "max-w-0 opacity-0 md:max-w-0 md:opacity-0 md:group-hover:max-w-[220px] md:group-hover:opacity-100",
            )}
          >
            <div className="min-w-[156px] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Background Sound
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Slider
                aria-label="Background sound volume"
                className="mt-2"
                min={0}
                max={100}
                step={1}
                value={[Math.round(volume * 100)]}
                onValueChange={(values) => {
                  void handleVolumeChange(values);
                }}
              />
            </div>
          </div>

          <div className="flex items-center rounded-full border border-white/30 bg-white/80 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                void handleMuteToggle();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800"
              aria-label={
                isMuted ? "Unmute homepage sound" : "Mute homepage sound"
              }
              aria-pressed={!isMuted}
            >
              <VolumeIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="ml-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label={
                isExpanded ? "Hide volume controls" : "Show volume controls"
              }
              aria-expanded={isExpanded}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
