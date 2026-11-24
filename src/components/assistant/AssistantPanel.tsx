import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Play, AlertTriangle, Target, Trash2, Mic, Square, Volume2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { recordWav, speakCoachReply, transcribeVoice } from "@/lib/voice";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useFocus } from "@/context/FocusContext";
import { getBestFocusWindow, getWeeklyFocus, getWeeklyFocusTotal, getNextBestAction } from "@/lib/analytics";
import { format } from "date-fns";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  tone?: "directive" | "warning" | "default";
}

type VoiceRecorder = Awaited<ReturnType<typeof recordWav>>;
type VoiceState = "idle" | "recording" | "transcribing" | "speaking";

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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechAbortRef = useRef<AbortController | null>(null);

  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  const next = useMemo(() => getNextBestAction(tasks, now), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildContext = () => {
    const weekly = getWeeklyFocus(sessions, now);
    return {
      now: now.toISOString(),
      tasks: tasks
        .slice(0, 100)
        .map((t) => ({
          title: t.title,
          done: t.done,
          priority: t.priority,
          dueDate: t.dueDate,
          estimateMin: t.estimateMin,
          tag: t.tag,
          notes: t.notes,
          overdue: !t.done && t.dueDate < todayKey,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addWarning = (text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text, tone: "warning" }]);
  };

  const playReply = async (message: Msg) => {
    speechAbortRef.current?.abort();
    const controller = new AbortController();
    speechAbortRef.current = controller;
    setSpeakingMessageId(message.id);
    setVoiceState("speaking");
    try {
      const spokenText = message.text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/[`*_>#-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (spokenText) await speakCoachReply(spokenText, controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) {
        addWarning(`I couldn't play that reply aloud: ${(error as Error).message || "Please try again."}`);
      }
    } finally {
      if (speechAbortRef.current === controller) speechAbortRef.current = null;
      setSpeakingMessageId(null);
      setVoiceState("idle");
    }
  };

  const ask = async (text: string, _history: Msg[], persistPrompt = true, voiceReply = false) => {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("coach", {
        body: { context: buildContext(), message: text, persist: persistPrompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const reply: Msg = { id: crypto.randomUUID(), role: "assistant", text: data.reply, tone: "directive" };
      setMessages((m) => [...m, reply]);
      if (voiceReply) void playReply(reply);
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

  // Load saved history the first time the panel opens; greet only if there is none.
  useEffect(() => {
    if (!open || loaded || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("coach_messages")
        .select("id, role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) console.error("Failed to load coach history", error);
      const past: Msg[] = (data ?? []).reverse().map((r) => ({
        id: r.id,
        role: r.role as Msg["role"],
        text: r.content,
        tone: r.role === "assistant" ? "directive" : undefined,
      }));
      setMessages(past);
      setLoaded(true);
      if (past.length === 0) {
        ask("Greet me briefly and mention one useful thing about my tasks today. Keep it short and friendly.", [], false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, loaded]);

  const clearHistory = async () => {
    if (!user || thinking) return;
    const { error } = await supabase.from("coach_messages").delete().eq("user_id", user.id);
    if (error) { console.error(error); return; }
    setMessages([]);
  };

  const send = (text: string, voiceReply = false) => {
    if (!text.trim() || thinking || !loaded) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    void ask(text, history, true, voiceReply);
  };

  const stopRecordingAndSend = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    setVoiceState("transcribing");
    try {
      const audio = await recorder.stop();
      const transcript = await transcribeVoice(audio);
      if (!transcript.trim()) throw new Error("I didn't catch that. Please try speaking again.");
      setVoiceState("idle");
      send(transcript, true);
    } catch (error) {
      setVoiceState("idle");
      addWarning(`Voice message couldn't be sent: ${(error as Error).message || "Please try again."}`);
    }
  };

  const toggleRecording = async () => {
    if (voiceState === "recording") {
      await stopRecordingAndSend();
      return;
    }
    if (voiceState !== "idle" || thinking) return;
    try {
      recorderRef.current = await recordWav();
      setVoiceState("recording");
      recordingTimeoutRef.current = setTimeout(() => void stopRecordingAndSend(), 60_000);
    } catch (error) {
      recorderRef.current = null;
      addWarning(`Microphone unavailable: ${(error as Error).message || "Check microphone permission and try again."}`);
    }
  };

  useEffect(() => {
    if (open) return;
    speechAbortRef.current?.abort();
    speechAbortRef.current = null;
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    recordingTimeoutRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) void recorder.stop().catch(() => undefined);
    setVoiceState("idle");
    setSpeakingMessageId(null);
  }, [open]);

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
              <div className="flex items-center gap-1">
                <button onClick={clearHistory} aria-label="Clear chat history" title="Clear chat history" className="press h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={onClose} aria-label="Close coach" className="press h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
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
                  {m.role === "assistant" && m.tone !== "warning" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (speakingMessageId === m.id) {
                          speechAbortRef.current?.abort();
                          return;
                        }
                        void playReply(m);
                      }}
                      aria-label={speakingMessageId === m.id ? "Stop spoken reply" : "Play spoken reply"}
                      title={speakingMessageId === m.id ? "Stop spoken reply" : "Play spoken reply"}
                      className="press ml-1 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {speakingMessageId === m.id ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  )}
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
              {voiceState !== "idle" && (
                <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground" role="status" aria-live="polite">
                  {voiceState === "recording" && <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />}
                  {voiceState === "recording" && "Recording — tap the microphone to send"}
                  {voiceState === "transcribing" && "Transcribing your message…"}
                  {voiceState === "speaking" && "Speaking the coach’s reply…"}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border focus-within:border-primary/50 focus-within:shadow-glow-primary transition-all">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your tasks, or just chat..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  onClick={() => void toggleRecording()}
                  disabled={(voiceState !== "idle" && voiceState !== "recording") || thinking}
                  aria-label={voiceState === "recording" ? "Stop recording and send" : "Start voice chat"}
                  aria-pressed={voiceState === "recording"}
                  title={voiceState === "recording" ? "Stop recording and send" : "Start voice chat"}
                  className={cn(
                    "press grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-40",
                    voiceState === "recording"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {voiceState === "recording" ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
                </button>
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
