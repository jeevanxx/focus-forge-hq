import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLogFocusSession } from "@/hooks/useFocusSessions";

type Mode = "focus" | "break";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, break: 5 * 60 };

export const FocusTimer = () => {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const prevSecondsRef = useRef(DURATIONS.focus);
  const { mutate: logSession } = useLogFocusSession();

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

  // Log a focus session when the timer naturally reaches 0
  useEffect(() => {
    if (prevSecondsRef.current > 0 && secondsLeft === 0 && mode === "focus") {
      logSession({ durationMin: DURATIONS.focus / 60 });
    }
    prevSecondsRef.current = secondsLeft;
  }, [secondsLeft]);

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
    <div className="relative p-6 sm:p-7 rounded-2xl border border-border-strong bg-gradient-card-raised shadow-elev-lg overflow-hidden">
      {/* Layered glow */}
      <div className="absolute inset-0 bg-gradient-glow-strong opacity-80 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-ember-glow" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Focus Session</div>
            <h3 className="font-display text-2xl font-bold mt-1 tracking-tight">
              {mode === "focus" ? "Deep Work" : "Recover"}
            </h3>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-background/60 border border-border backdrop-blur">
            <button
              onClick={() => switchMode("focus")}
              className={cn(
                "press px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all",
                mode === "focus" ? "bg-secondary text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Brain className="h-3 w-3" /> Focus
            </button>
            <button
              onClick={() => switchMode("break")}
              className={cn(
                "press px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all",
                mode === "break" ? "bg-secondary text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Coffee className="h-3 w-3" /> Break
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center my-6">
          <div className="relative h-60 w-60">
            {/* Ambient glow ring */}
            {running && (
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-ember-glow" />
            )}
            <svg className="relative w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#emberGrad)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: "stroke-dashoffset 0.6s var(--ease-out-expo)",
                  filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))",
                }}
              />
              <defs>
                <linearGradient id="emberGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary-deep))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-6xl font-bold tracking-tight tabular-nums leading-none">
                  {mm}<span className="text-muted-foreground/60">:</span>{ss}
                </div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-bold mt-2 inline-flex items-center gap-1.5">
                  {running && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-glow-primary" />}
                  {running ? "In session" : "Ready"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="icon" onClick={reset} className="press h-11 w-11 rounded-full hover:bg-secondary">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "press h-14 px-10 rounded-full font-bold text-base bg-gradient-ember text-primary-foreground shadow-ember-lg hover:shadow-ember hover:-translate-y-0.5 transition-all",
              running && "animate-ember-pulse"
            )}
          >
            {running ? <Pause className="h-4 w-4 mr-1.5" strokeWidth={2.5} /> : <Play className="h-4 w-4 mr-1.5" strokeWidth={2.5} />}
            {running ? "Pause" : "Start"}
          </Button>
          <div className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
};
