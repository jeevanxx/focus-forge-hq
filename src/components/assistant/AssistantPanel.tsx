import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Play, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocus } from "@/context/FocusContext";
import { getBestFocusWindow, getWeeklyFocus, getWeeklyFocusTotal, getNextBestAction } from "@/lib/analytics";
import { sanitizeContext, sanitizeMessages } from "@/lib/coachSanitizer";
import { format } from "date-fns";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  tone?: "directive" | "warning" | "default";
}

const quickPrompts = [
  "What should I do RIGHT NOW?",
  "Sequence my day",
  "Why am I behind?",
  "Break my top task down",
];

const renderText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-bold text-foreground">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

export const AssistantPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { sessions } = useFocusSessions();
  const { start } = useFocus();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  const next = useMemo(() => getNextBestAction(tasks, now), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildContext = () => {
    const weekly = getWeeklyFocus(sessions, now);
    return {
      now: now.toISOString(),
      tasks: tasks
        .filter((t) => !t.done)
        .slice(0, 20)
        .map((t) => ({
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate,
          estimateMin: t.estimateMin,
          overdue: t.dueDate < todayKey,
        })),
      habits: habits.map((h) => ({
        name: h.name,
        streak: h.streak,
        doneToday: h.history[h.history.length - 1],
      })),
      focusMinutesToday: weekly.find((d) => d.date === todayKey)?.minutes ?? 0,
      focusMinutesWeek: getWeeklyFocusTotal(sessions, now),
      bestWindow: getBestFocusWindow(sessions)?.label ?? "unknown",
    };
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (text: string, history: Msg[]) => {
    setThinking(true);
    try {
      const rawMessages = [
        ...history.map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: text },
      ];
      const { data, error } = await supabase.functions.invoke("coach", {
        body: {
          context: sanitizeContext(buildContext()),
          messages: sanitizeMessages(rawMessages),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: data.reply, tone: "directive" },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          tone: "warning",
          text: (e as Error).message || "Coach is offline. Start your top task anyway — 25 minutes.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // Kick off an opening directive the first time the panel opens.
  useEffect(() => {
    if (!open || messages.length > 0 || thinking) return;
    ask("Open with a short directive for right now, based on my data.", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    ask(text, history);
  };

  const startNow = () => {
    start({
      minutes: next.suggestedMinutes || 25,
      taskTitle: next.task?.title,
      taskId: next.task?.id,
    });
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        tone: "directive",
        text: `Timer running. ${next.suggestedMinutes || 25} minutes. Phone face-down.`,
      },
    ]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            className={cn(
              "fixed z-50 flex flex-col bg-gradient-card-raised border border-border-strong shadow-elev-lg overflow-hidden",
              "inset-x-3 bottom-3 top-16 rounded-2xl",
              "lg:inset-auto lg:right-6 lg:bottom-6 lg:top-auto lg:w-[440px] lg:h-[680px]"
            )}
          >
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none animate-ember-glow" />

            <div className="relative flex items-center justify-between px-5 py-4 border-b border-border-strong bg-background/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-ember grid place-items-center shadow-ember">
                  <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-display text-base font-bold leading-tight tracking-tight">Forge Coach</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold inline-flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_6px_hsl(var(--success))]" />
                    Watching your day
                  </div>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close coach" className="press h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="relative flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
                >
                  {m.role === "assistant" && m.tone === "warning" && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-destructive ml-1">
                      <AlertTriangle className="h-3 w-3" /> Reality check
                    </div>
                  )}
                  {m.role === "assistant" && m.tone === "directive" && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary ml-1">
                      <Target className="h-3 w-3" /> Directive
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[88%] px-4 py-3 rounded-2xl text-[13.5px] whitespace-pre-line leading-relaxed",
                      m.role === "user"
                        ? "bg-gradient-ember text-primary-foreground shadow-ember rounded-br-md font-medium"
                        : m.tone === "warning"
                        ? "bg-destructive/10 border border-destructive/30 text-foreground rounded-bl-md"
                        : m.tone === "directive"
                        ? "bg-gradient-primary-card border border-primary/30 text-foreground rounded-bl-md shadow-soft"
                        : "bg-secondary/70 backdrop-blur-md border border-border text-foreground rounded-bl-md"
                    )}
                  >
                    {renderText(m.text)}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-secondary/70 border border-border rounded-bl-md">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {next.task && (
              <div className="relative px-4 pb-2">
                <button
                  onClick={startNow}
                  className="press w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-gradient-ember text-primary-foreground shadow-ember hover:shadow-ember-lg transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
                  Start {next.suggestedMinutes || 25}m on “{next.task.title.slice(0, 28)}{next.task.title.length > 28 ? "…" : ""}”
                </button>
              </div>
            )}

            <div className="relative px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="press shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="relative p-3 border-t border-border-strong bg-background/40 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border focus-within:border-primary/50 focus-within:shadow-glow-primary transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Push back, or ask for orders..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  aria-label="Send"
                  className="press h-9 w-9 rounded-lg bg-gradient-ember shadow-ember grid place-items-center disabled:opacity-40 disabled:shadow-none"
                >
                  <Send className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
