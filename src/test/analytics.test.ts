import { describe, it, expect } from "vitest";
import { getWeeklyFocus } from "../lib/analytics";
import { FocusSession } from "../lib/mock-data";
import { addDays, startOfWeek, format } from "date-fns";

describe("analytics", () => {
  describe("getWeeklyFocus", () => {
    it("should correctly group sessions by day and exclude sessions outside current week", () => {
      const now = new Date("2024-05-22T12:00:00Z"); // A Wednesday
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 2024-05-20

      const sessions: FocusSession[] = [
        { id: "s1", date: new Date("2024-05-19T23:59:59Z").toISOString(), durationMin: 10, taskTitle: "Last Week" },
        { id: "s2", date: new Date("2024-05-20T08:00:00Z").toISOString(), durationMin: 20, taskTitle: "Monday" },
        { id: "s3", date: new Date("2024-05-20T20:00:00Z").toISOString(), durationMin: 30, taskTitle: "Monday" },
        { id: "s4", date: new Date("2024-05-22T10:00:00Z").toISOString(), durationMin: 40, taskTitle: "Wednesday" },
        { id: "s5", date: new Date("2024-05-26T23:59:00Z").toISOString(), durationMin: 50, taskTitle: "Sunday" },
        { id: "s6", date: new Date("2024-05-27T00:00:01Z").toISOString(), durationMin: 60, taskTitle: "Next Week" },
      ];

      const result = getWeeklyFocus(sessions, now);

      expect(result).toHaveLength(7);

      // Monday
      expect(result[0].minutes).toBe(50);
      expect(result[0].date).toBe("2024-05-20");

      // Tuesday
      expect(result[1].minutes).toBe(0);

      // Wednesday
      expect(result[2].minutes).toBe(40);
      expect(result[2].date).toBe("2024-05-22");

      // Sunday
      expect(result[6].minutes).toBe(50);
      expect(result[6].date).toBe("2024-05-26");
    });

    it("should handle empty sessions", () => {
      const now = new Date();
      const result = getWeeklyFocus([], now);
      expect(result).toHaveLength(7);
      result.forEach(d => expect(d.minutes).toBe(0));
    });
  });
});
