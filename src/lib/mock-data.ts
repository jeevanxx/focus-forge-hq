// Mock data for Focus Forge — Phase 1 (frontend only).
// Will be replaced with Supabase queries in Phase 2.

import { addDays, startOfWeek, format } from "date-fns";

export type Priority = "low" | "med" | "high";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  priority: Priority;
  dueDate: string; // ISO date
  estimateMin?: number;
  tag?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  target: number; // per week
  history: boolean[]; // last 7 days, oldest first
  color: "ember" | "amber" | "violet" | "teal";
}

export interface FocusSession {
  id: string;
  date: string; // ISO
  durationMin: number;
  taskTitle?: string;
}

const today = new Date();
const iso = (d: Date) => format(d, "yyyy-MM-dd");

export const mockTasks: Task[] = [
  { id: "t1", title: "Ship onboarding redesign", priority: "high", done: false, dueDate: iso(today), estimateMin: 90, tag: "Design", notes: "Focus on first-run flow + empty states." },
  { id: "t2", title: "Deep work: Q2 strategy memo", priority: "high", done: false, dueDate: iso(today), estimateMin: 60, tag: "Strategy" },
  { id: "t3", title: "Review pull requests", priority: "med", done: true, dueDate: iso(today), estimateMin: 30, tag: "Engineering" },
  { id: "t4", title: "Reply to investor update thread", priority: "med", done: false, dueDate: iso(today), estimateMin: 20, tag: "Comms" },
  { id: "t5", title: "Workout — pull day", priority: "low", done: false, dueDate: iso(today), estimateMin: 45, tag: "Health" },
  { id: "t6", title: "Plan next sprint", priority: "high", done: false, dueDate: iso(addDays(today, 1)), estimateMin: 60, tag: "Planning" },
  { id: "t7", title: "1:1 with Maya", priority: "med", done: false, dueDate: iso(addDays(today, 1)), estimateMin: 30, tag: "Team" },
  { id: "t8", title: "Read: Deep Work ch.4", priority: "low", done: false, dueDate: iso(addDays(today, 2)), estimateMin: 40, tag: "Learning" },
  { id: "t9", title: "Quarterly metrics review", priority: "high", done: false, dueDate: iso(addDays(today, 3)), estimateMin: 75, tag: "Strategy" },
  { id: "t10", title: "Cold outreach batch", priority: "med", done: false, dueDate: iso(addDays(today, 4)), estimateMin: 45, tag: "Growth" },
];

export const mockHabits: Habit[] = [
  { id: "h1", name: "Deep work block", emoji: "🔥", streak: 12, target: 6, history: [true, true, true, false, true, true, true], color: "ember" },
  { id: "h2", name: "Morning workout", emoji: "💪", streak: 5, target: 5, history: [true, false, true, true, true, false, true], color: "amber" },
  { id: "h3", name: "Read 30 min", emoji: "📚", streak: 21, target: 7, history: [true, true, true, true, true, true, true], color: "violet" },
  { id: "h4", name: "No phone before 9am", emoji: "🧘", streak: 3, target: 7, history: [false, true, true, false, true, true, true], color: "teal" },
];

const weekStart = startOfWeek(today, { weekStartsOn: 1 });
export const mockSessions: FocusSession[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `s${i}`,
  date: iso(addDays(weekStart, i % 7)),
  durationMin: [25, 25, 50, 25, 90, 50, 25][i % 7],
  taskTitle: ["Strategy memo", "Onboarding", "Code review", "Deep work", "Sprint plan"][i % 5],
}));

export const mockAssistantSuggestions = [
  "Start with your highest-leverage task: the onboarding redesign.",
  "You have 3h of deep work scheduled — protect 9–11am.",
  "Skip the inbox until after your first focus block.",
];
