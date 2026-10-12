import { describe, test, expect } from "vitest";
import type { Habit } from "../lib/types";

function calculateHabitStats(habits: Habit[]) {
  let totalStreak = 0;
  let completedThisWeek = 0;
  let targetThisWeek = 0;
  let bestStreak = 0;

  for (const h of habits) {
    totalStreak += h.streak;
    targetThisWeek += h.target;
    if (h.streak > bestStreak) bestStreak = h.streak;
    for (const done of h.history) {
      if (done) completedThisWeek++;
    }
  }

  return { totalStreak, completedThisWeek, targetThisWeek, bestStreak };
}

describe("Habits statistics calculation optimization", () => {
  test("calculates statistics correctly for empty habits array", () => {
    const stats = calculateHabitStats([]);
    expect(stats).toEqual({
      totalStreak: 0,
      completedThisWeek: 0,
      targetThisWeek: 0,
      bestStreak: 0,
    });
  });

  test("calculates statistics correctly for habit list", () => {
    const sampleHabits: Habit[] = [
      {
        id: "1",
        name: "Morning Run",
        emoji: "🏃",
        color: "ember",
        target: 5,
        history: [true, true, false, true, true, false, true], // 5 true
        streak: 12,
        freezeActive: false,
      },
      {
        id: "2",
        name: "Read 30 mins",
        emoji: "📚",
        color: "amber",
        target: 7,
        history: [true, true, true, true, true, true, true], // 7 true
        streak: 45,
        freezeActive: true,
      },
    ];

    const stats = calculateHabitStats(sampleHabits);

    expect(stats).toEqual({
      totalStreak: 57,
      completedThisWeek: 12,
      targetThisWeek: 12,
      bestStreak: 45,
    });
  });
});
