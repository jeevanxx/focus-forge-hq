import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Play, AlertTriangle, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTasks } from "@/lib/mock-data";

interface Action {
  label: string;
  kind: "start" | "plan" | "skip";
  taskId?: string;
  minutes?: number;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  tone?: "directive" | "warning" | "default";
  actions?: Action[];
}

/* ---------- Coach context ---------- */

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

const getOpeningMessage = (): Msg => {
  const tod = getTimeOfDay();
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = mockTasks.filter((t) => t.dueDate === today && !t.done);
  const highPriority = todayTasks.filter((t) => t.priority === "high");
  const top = highPriority[0] ?? todayTasks[0];

  let text = "";
  if (tod === "morning" && top) {
    text = `It's ${tod}. Your peak window. Don't waste it on email.\n\n**Start with "${top.title}"** — it's your highest-leverage task. ${top.estimateMin ?? 25} minutes, deep focus, no tabs.`;
  } else if (tod === "afternoon" && top) {
    text = `Afternoon energy dips. You've still got "${top.title}" untouched.\n\n**Start a 25-minute focus block now.** Momentum beats motivation.`;
  } else if (top) {
    text = `Evening. ${todayTasks.length} tasks still open from today.\n\nPick one — "${top.title}" — and finish it. Don't carry debt into tomorrow.`;
  } else {
    text = "Day's clear. Don't invent work — rest is part of the system. See you tomorrow at 9am.";
  }

  return {
    id: "open",
    role: "assistant",
    text,
    tone: "directive",
    actions: top
      ? [
          { label: `Start ${top.estimateMin ?? 25}m focus`, kind: "start", taskId: top.id, minutes: top.estimateMin ?? 25 },
          { label: "Plan my day", kind: "plan" },
        ]
      : undefined,
  };
};

const quickPrompts = [
  "What should I do RIGHT NOW?",
  "Sequence my day",
  "Why am I behind?",
  "Break this task down",
];

/* ---------- Strict coach replies ---------- */

const coachReply = (input: string): Msg => {
  const t = input.toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = mockTasks.filter((t) => t.dueDate === today && !t.done);
  const top = todayTasks.find((x) => x.priority === "high") ?? todayTasks[0];
  const id = crypto.randomUUID();

  // RIGHT NOW / first / start
  if (t.includes("now") || t.includes("first") || t.includes("start") || t.includes("do")) {
    if (!top) return { id, role: "assistant", text: "Nothing pending. Don't manufacture work — close the laptop.", tone: "default" };
    return {
      id,
      role: "assistant",
      tone: "directive",
      text: `Stop scrolling. **"${top.title}"** — high priority, ${top.estimateMin ?? 25} minutes, starting now.\n\nNo planning, no checking Slack. Just open it and write the first line.`,
      actions: [
        { label: `Start ${top.estimateMin ?? 25}m focus`, kind: "start", taskId: top.id, minutes: top.estimateMin ?? 25 },
      ],
    };
  }

  // Sequence / plan
  if (t.includes("sequence") || t.includes("plan") || t.includes("order")) {
    const ordered = [...todayTasks].sort((a, b) => {
      const order = { high: 0, med: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
    const list = ordered.slice(0, 5).map((x, i) => `${i + 1}. **${x.title}** — ${x.estimateMin ?? 25}m`).join("\n");
    return {
      id,
      role: "assistant",
      tone: "directive",
      text: `Here's the order. Don't deviate:\n\n${list}\n\nTotal: ${ordered.reduce((s, x) => s + (x.estimateMin ?? 25), 0)} minutes of real work. Begin with #1 in the next 60 seconds.`,
      actions: ordered[0]
        ? [{ label: `Start "${ordered[0].title.slice(0, 24)}${ordered[0].title.length > 24 ? "…" : ""}"`, kind: "start", taskId: ordered[0].id, minutes: ordered[0].estimateMin ?? 25 }]
        : undefined,
    };
  }

  // Behind / late / delay
  if (t.includes("behind") || t.includes("late") || t.includes("delay") || t.includes("losing")) {
    return {
      id,
      role: "assistant",
      tone: "warning",
      text: `Honest answer: you've delayed **"${top?.title ?? "your top task"}"** for 2 days. That's avoidance, not strategy.\n\nThe fix isn't more planning. It's a 25-minute block, right now, no exceptions.`,
      actions: top
        ? [{ label: "Start 25m block now", kind: "start", taskId: top.id, minutes: 25 }]
        : undefined,
    };
  }

  // Break down
  if (t.includes("break") || t.includes("split") || t.includes("decompose")) {
    return {
      id,
      role: "assistant",
      tone: "directive",
      text: `Stop overthinking it. Break it like this:\n\n• **10m** — brain-dump every angle, zero editing\n• **20m** — pick the 3 strongest, write thesis lines\n• **25m** — draft the first section, ugly first draft only\n\nThat's a 55-minute path to done. Start the first 10 now.`,
      actions: [{ label: "Start 25m focus", kind: "start", minutes: 25 }],
    };
  }

  // Default — push back
  return {
    id,
    role: "assistant",
    tone: "default",
    text: `Be specific. "${input}" is too vague to act on. Tell me: which task, which blocker, or do you want me to pick for you?`,
    actions: top
      ? [{ label: "Pick for me", kind: "start", taskId: top.id, minutes: top.estimateMin ?? 25 }]
      : undefined,
  };
};

/* ---------- Markdown-lite (bold) ---------- */

const renderText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
};

/* ---------- Panel ---------- */

export const AssistantPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>([getOpeningMessage()]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, coachReply(text)]);
      setThinking(false);
    }, 650);
  };

  const handleAction = (a: Action) => {
    const confirmation: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      tone: "directive",
      text:
        a.kind === "start"
          ? `Timer running. ${a.minutes ?? 25} minutes. Phone face-down.\n\nI'll check on you when it's done.`
          : "Locked in. Don't move from #1.",
    };
    setMessages((m) => [...m, confirmation]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            {/* Ambient glow */}
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
              <button onClick={onClose} className="press h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="relative flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
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

                  {m.actions && (
                    <div className="flex flex-wrap gap-2 ml-1">
                      {m.actions.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(a)}
                          className={cn(
                            "press inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all",
                            a.kind === "start"
                              ? "bg-gradient-ember text-primary-foreground shadow-ember hover:shadow-ember-lg hover:-translate-y-0.5"
                              : "bg-card/80 border border-border-strong text-foreground hover:border-primary/40"
                          )}
                        >
                          {a.kind === "start" ? <Play className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} /> : <Zap className="h-3.5 w-3.5" />}
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-secondary/70 border border-border rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

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
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
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
                  disabled={!input.trim()}
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
