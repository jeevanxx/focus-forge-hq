// Domain types for Focus Forge. Backed by the database, mapped in hooks.

export type Priority = "low" | "med" | "high";
export type HabitColor = "ember" | "amber" | "violet" | "teal";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  priority: Priority;
  dueDate: string; // yyyy-MM-dd
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
  color: HabitColor;
}

export interface FocusSession {
  id: string;
  date: string; // ISO datetime
  durationMin: number;
  taskTitle?: string;
}
