import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { toast } from "@/hooks/use-toast";

export type FocusMode = "focus" | "break";

export const DEFAULT_DURATIONS: Record<FocusMode, number> = { focus: 25, break: 5 };

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
};

const FocusContext = createContext<FocusContextValue | undefined>(undefined);

export const FocusProvider = ({ children }: { children: ReactNode }) => {
  const { logSession } = useFocusSessions();
  const [mode, setModeState] = useState<FocusMode>("focus");
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_DURATIONS.focus * 60);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [running, setRunning] = useState(false);
  const [taskTitle, setTaskTitle] = useState<string | undefined>();
  const [taskId, setTaskId] = useState<string | undefined>();
  const startedAtRef = useRef<Date | null>(null);

  const finish = useCallback(() => {
    setRunning(false);
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
    const minutes = opts?.minutes ?? DEFAULT_DURATIONS.focus;
    setModeState("focus");
    setTotalSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
    setTaskTitle(opts?.taskTitle);
    setTaskId(opts?.taskId);
    startedAtRef.current = new Date();
    setRunning(true);
  }, []);

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
    const secs = DEFAULT_DURATIONS[m] * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setRunning(false);
    startedAtRef.current = null;
    if (m === "break") {
      setTaskTitle(undefined);
      setTaskId(undefined);
    }
  }, []);

  return (
    <FocusContext.Provider
      value={{ mode, running, secondsLeft, totalSeconds, taskTitle, taskId, start, pause, resume, reset, setMode }}
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
