import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Mode = "focus" | "break";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };

export const FocusTimer = () => {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setSecondsLeft(DURATIONS[m]);
    setRunning(false);
  };

  const reset = () => {
    setSecondsLeft(DURATIONS[mode]);
    setRunning(false);
  };

  const total = DURATIONS[mode];
  const progress = 1 - secondsLeft / total;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="relative p-6 sm:p-7 rounded-2xl border border-border bg-gradient-card shadow-elev overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-60 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Focus Session</div>
            <h3 className="font-display text-xl font-semibold mt-0.5">
              {mode === "focus" ? "Deep Work" : "Recover"}
            </h3>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-secondary border border-border">
            <button
              onClick={() => switchMode("focus")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all",
                mode === "focus" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              <Brain className="h-3 w-3" /> Focus
            </button>
            <button
              onClick={() => switchMode("break")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all",
                mode === "break" ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              <Coffee className="h-3 w-3" /> Break
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center my-4">
          <div className="relative h-56 w-56">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#emberGrad)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.6s var(--ease-out-expo)" }}
              />
              <defs>
                <linearGradient id="emberGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-5xl font-semibold tracking-tight tabular-nums">
                  {mm}<span className="text-muted-foreground">:</span>{ss}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  {running ? "In session" : "Ready"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={reset} className="h-11 w-11 rounded-full">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "h-14 px-8 rounded-full font-semibold text-base bg-gradient-ember text-primary-foreground shadow-ember hover:opacity-95",
              running && "animate-ember-pulse"
            )}
          >
            {running ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
            {running ? "Pause" : "Start"}
          </Button>
          <div className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
};
