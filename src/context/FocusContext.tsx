import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { toast } from "@/hooks/use-toast";

export type FocusMode = "focus" | "break";

export const DEFAULT_DURATIONS: Record<FocusMode, number> = { focus: 25, break: 5 };

export const PRESETS = [
  { id: "25-5", label: "25 / 5", focus: 25, break: 5 },
  { id: "50-10", label: "50 / 10", focus: 50, break: 10 },
  { id: "90-15", label: "90 / 15", focus: 90, break: 15 },
] as const;
export type PresetId = typeof PRESETS[number]["id"];

const PRESET_KEY = "ff_timer_preset";
const loadPreset = (): PresetId => {
  const v = localStorage.getItem(PRESET_KEY);
  return (PRESETS.find((p) => p.id === v)?.id ?? "25-5") as PresetId;
};

/** Soft two-note chime built in the browser — no audio files needed. */
const playChime = () => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch { /* audio unavailable */ }
};

const notify = (title: string, body: string) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;
  try { new Notification(title, { body, icon: "/icons/icon-192.png" }); } catch { /* ignore */ }
};

type FocusContextValue = {
  mode: FocusMode;
  running: boolean;
  secondsLeft: number;
  totalSeconds: number;
  taskTitle?: string;
  taskId?: string;
  start: (opts?: { minutes?: number; taskTitle?: string; taskId?: string }) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setMode: (mode: FocusMode) => void;
  preset: PresetId;
  setPreset: (id: PresetId) => void;
};

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

export const FocusProvider = ({ children }: { children: ReactNode }) => {
  const { logSession } = useFocusSessions();
  const [preset, setPresetState] = useState<PresetId>(loadPreset);
  const durations = PRESETS.find((p) => p.id === preset)!;
  const [mode, setModeState] = useState<FocusMode>("focus");
  const [totalSeconds, setTotalSeconds] = useState(durations.focus * 60);
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60);
  const [running, setRunning] = useState(false);
  const [taskTitle, setTaskTitle] = useState<string | undefined>();
  const [taskId, setTaskId] = useState<string | undefined>();
  const startedAtRef = useRef<Date | null>(null);

  const finish = useCallback(() => {
    setRunning(false);
    playChime();
    notify(
      mode === "focus" ? "Focus block done" : "Break over",
      mode === "focus" ? "Session banked. Take a short break." : "Back to work. Start your next block.",
    );
    const elapsedMin = Math.max(1, Math.round(totalSeconds / 60));
    if (mode === "focus") {
      logSession.mutate({
        durationMin: elapsedMin,
        taskTitle,
        taskId,
        startedAt: startedAtRef.current ?? new Date(),
      });
      toast({
        title: "Session logged",
        description: `${elapsedMin} minutes of deep work banked.`,
      });
    }
    setSecondsLeft(totalSeconds);
    startedAtRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, totalSeconds, taskTitle, taskId]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, finish]);

  const start: FocusContextValue["start"] = useCallback((opts) => {
    const minutes = opts?.minutes ?? durations.focus;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    setModeState("focus");
    setTotalSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
    setTaskTitle(opts?.taskTitle);
    setTaskId(opts?.taskId);
    startedAtRef.current = new Date();
    setRunning(true);
  }, [durations.focus]);

  const pause = useCallback(() => setRunning(false), []);

  const resume = useCallback(() => {
    if (!startedAtRef.current) startedAtRef.current = new Date();
    setRunning(true);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
    startedAtRef.current = null;
  }, [totalSeconds]);

  const setMode = useCallback((m: FocusMode) => {
    setModeState(m);
    const secs = durations[m] * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setRunning(false);
    startedAtRef.current = null;
    if (m === "break") {
      setTaskTitle(undefined);
      setTaskId(undefined);
    }
  }, [durations]);

  const setPreset = useCallback((id: PresetId) => {
    localStorage.setItem(PRESET_KEY, id);
    setPresetState(id);
    const p = PRESETS.find((x) => x.id === id)!;
    const secs = p[mode] * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setRunning(false);
    startedAtRef.current = null;
  }, [mode]);

  return (
    <FocusContext.Provider
      value={{ mode, running, secondsLeft, totalSeconds, taskTitle, taskId, start, pause, resume, reset, setMode, preset, setPreset }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within a FocusProvider");
  return ctx;
};
