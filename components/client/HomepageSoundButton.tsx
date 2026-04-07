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
          className="max-w-[380px] overflow-hidden rounded-[32px] border border-white/30 bg-[rgba(226,241,255,0.14)] p-0 text-white shadow-[0_24px_90px_rgba(15,23,42,0.42)] backdrop-blur-3xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.2),rgba(191,219,254,0.08))]" />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/90 to-transparent" />
            <div className="relative">
              <DialogHeader className="items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-[rgba(240,249,255,0.22)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_34px_rgba(15,23,42,0.26)] backdrop-blur-2xl">
                  <Waves className="h-6 w-6" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[rgba(240,249,255,0.14)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-50/90 backdrop-blur-2xl">
                  Ambient Player
                </div>
                <DialogTitle className="mt-4 text-2xl font-black text-white">
                  Let the store play
                </DialogTitle>
              </DialogHeader>

              <div className="mt-5 rounded-[26px] border border-white/20 bg-[rgba(15,23,42,0.12)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl">
                <div className="flex items-start gap-3 rounded-[20px] border border-white/15 bg-[rgba(240,249,255,0.1)] px-4 py-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(240,249,255,0.16)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Saved controls
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-100/70">
                      Your mute and volume settings will stay remembered across
                      pages and future visits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                <Button
                  type="button"
                  className="h-12 rounded-2xl border border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.26),rgba(186,230,253,0.2))] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_28px_rgba(15,23,42,0.24)] backdrop-blur-2xl hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(186,230,253,0.24))]"
                  onClick={() => {
                    void handleEnableSound();
                  }}
                >
                  Enable Sound
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-white/28 bg-[rgba(240,249,255,0.12)] font-bold text-white backdrop-blur-2xl hover:bg-[rgba(240,249,255,0.18)] hover:text-white"
                  onClick={handleKeepMuted}
                >
                  Keep Muted
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="pointer-events-none fixed bottom-32 right-4 z-40 md:bottom-8 md:right-6">
        <div className="group pointer-events-auto flex items-end justify-end gap-3">
          <div
            className={cn(
              "relative flex items-center overflow-hidden rounded-[28px] border border-white/28 bg-[rgba(255,255,255,0.14)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-3xl transition-all duration-300",
              isExpanded
                ? "max-w-[260px] opacity-100"
                : "max-w-0 opacity-0 md:max-w-0 md:opacity-0 md:group-hover:max-w-[260px] md:group-hover:opacity-100",
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06)),repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_12px,rgba(255,255,255,0.02)_12px_24px),repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0_14px,transparent_14px_28px)]" />
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="relative min-w-[196px] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-700/80">
                  Ambient Sound
                </span>
                <span className="rounded-full border border-white/35 bg-[rgba(255,255,255,0.18)] px-2 py-0.5 text-[11px] font-bold text-slate-800/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-700/85">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-[rgba(255,255,255,0.18)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                  <Waves className="h-3.5 w-3.5" />
                </div>
                <span>
                  {isMuted ? "Muted" : "Playing across the storefront"}
                </span>
              </div>
              <Slider
                aria-label="Background sound volume"
                className="mt-3"
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

          <div className="relative flex flex-col items-center rounded-[30px] border border-white/28 bg-[rgba(255,255,255,0.14)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05)),repeating-linear-gradient(140deg,rgba(255,255,255,0.06)_0_12px,transparent_12px_24px)]" />
            <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <button
              type="button"
              onClick={() => {
                void handleMuteToggle();
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/28 bg-[rgba(255,255,255,0.22)] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-colors hover:bg-[rgba(255,255,255,0.3)]"
              aria-label={
                isMuted ? "Unmute storefront sound" : "Mute storefront sound"
              }
              aria-pressed={!isMuted}
            >
              <VolumeIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="relative mt-1 flex h-12 w-12 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-[rgba(255,255,255,0.24)]"
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
