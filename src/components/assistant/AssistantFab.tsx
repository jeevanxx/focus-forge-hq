import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AssistantPanel } from "./AssistantPanel";
import { useTasks } from "@/hooks/useTasks";
import { getNextBestAction, getDelayedHighPriority } from "@/lib/analytics";

export const AssistantFab = () => {
  const [open, setOpen] = useState(false);
  const [bubblesVisible, setBubblesVisible] = useState(true);
  const { tasks } = useTasks();

  const now = new Date();
  const delayed = getDelayedHighPriority(tasks, now);
  const next = getNextBestAction(tasks, now);
  const suggestions = [
    next.message,
    delayed.count > 0
      ? `${delayed.count} high-priority task${delayed.count > 1 ? "s" : ""} overdue. No more excuses.`
      : "Ask me what to do next — I'll pick for you.",
  ];

  return (
    <>
      {/* Floating suggestion bubbles */}
      <AnimatePresence>
        {!open && bubblesVisible && (
          <div className="fixed bottom-28 lg:bottom-24 right-5 z-40 flex flex-col items-end gap-2 max-w-[260px] pointer-events-none">
            {suggestions.slice(0, 2).map((s, i) => (

              <motion.button
                key={s}
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                onClick={() => setOpen(true)}
                className="pointer-events-auto text-left text-xs px-3.5 py-2.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-primary/25 text-foreground/90 shadow-elev hover:bg-card hover:border-primary/50 hover:scale-[1.02] transition-all"
                style={{ borderTopRightRadius: i === 1 ? "6px" : undefined }}
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span>{s}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          setOpen(true);
          setBubblesVisible(false);
        }}
        className="fixed bottom-24 lg:bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-gradient-ember shadow-ember grid place-items-center group"
        aria-label="Open AI assistant"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-ember animate-ember-pulse" />
        <Sparkles className="relative h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
      </motion.button>

      <AssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};
