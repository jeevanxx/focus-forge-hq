import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const seedMessages: Msg[] = [
  {
    id: "m1",
    role: "assistant",
    text: "Morning. You've got 5 tasks today and ~3.5h of estimated focus time. Want me to sequence them, or are you locked in already?",
  },
];

const quickPrompts = [
  "Plan my day",
  "What should I do first?",
  "Break down 'Q2 strategy memo'",
  "Where am I losing time this week?",
];

const mockReply = (input: string): string => {
  const t = input.toLowerCase();
  if (t.includes("plan")) return "Try this order:\n\n1. Q2 strategy memo (60m) — high cognitive load, do it first\n2. Onboarding redesign deep work (90m)\n3. Reply to investor thread (20m)\n4. Workout (45m)\n5. Review the rest after 4pm\n\nWant me to schedule the focus blocks?";
  if (t.includes("break") || t.includes("memo")) return "Here's how I'd split the strategy memo:\n\n• 10m: dump every angle into bullets, no editing\n• 20m: pick the 3 strongest, write thesis statements\n• 25m: draft section 1\n• 5m break, then continue\n\nStart with a 25m focus block?";
  if (t.includes("first")) return "Your highest-leverage task is the Q2 strategy memo — it's high priority, deep-work shaped, and you're sharpest now. Start a 50m session?";
  if (t.includes("losing") || t.includes("time")) return "You averaged 2.1h focus/day this week vs your 3h target. Most slippage is between 2–4pm. Want to block that window for shallow work only?";
  return "Got it. Tell me a bit more — is this about today's plan, a specific task, or how the week's shaping up?";
};

export const AssistantPanel = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>(seedMessages);
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
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: mockReply(text) }]);
      setThinking(false);
    }, 700);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            className={cn(
              "fixed z-50 flex flex-col bg-gradient-card border border-border shadow-elev",
              "inset-x-3 bottom-3 top-16 rounded-2xl",
              "lg:inset-auto lg:right-6 lg:bottom-6 lg:top-auto lg:w-[420px] lg:h-[640px]"
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 rounded-lg bg-gradient-ember grid place-items-center shadow-ember">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display text-base font-semibold leading-tight">Forge Coach</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Online</div>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed",
                      m.role === "user"
                        ? "bg-gradient-ember text-primary-foreground shadow-ember rounded-br-md"
                        : "bg-secondary/70 backdrop-blur-md border border-border rounded-bl-md"
                    )}
                  >
                    {m.text}
                  </div>
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

            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {q}
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border focus-within:border-primary/50 transition-colors">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your coach..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-8 w-8 rounded-lg bg-gradient-ember shadow-ember grid place-items-center disabled:opacity-40 disabled:shadow-none"
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
