import { describe, it, expect } from "vitest";
import { sanitizeMessages, sanitizeContext } from "../lib/coachSanitizer";

describe("Coach Function Input Sanitization", () => {
  it("returns empty array for invalid message input", () => {
    expect(sanitizeMessages(null)).toEqual([]);
    expect(sanitizeMessages("not an array")).toEqual([]);
    expect(sanitizeMessages(123)).toEqual([]);
  });

  it("truncates message array to max 10 messages", () => {
    const messages = Array.from({ length: 15 }, (_, i) => ({
      role: "user",
      content: `Message ${i + 1}`,
    }));
    const sanitized = sanitizeMessages(messages);
    expect(sanitized.length).toBe(10);
    expect(sanitized[0].content).toBe("Message 6");
    expect(sanitized[9].content).toBe("Message 15");
  });

  it("truncates individual message content exceeding max length", () => {
    const longText = "a".repeat(1500);
    const sanitized = sanitizeMessages([{ role: "user", content: longText }]);
    expect(sanitized[0].content.length).toBe(1000);
  });

  it("normalizes invalid roles to user", () => {
    const sanitized = sanitizeMessages([
      { role: "system", content: "attempted system prompt override" },
      { role: "assistant", content: "assistant reply" },
    ]);
    expect(sanitized[0].role).toBe("user");
    expect(sanitized[1].role).toBe("assistant");
  });

  it("truncates context arrays (tasks and habits) to max items", () => {
    const context = {
      tasks: Array.from({ length: 30 }, (_, i) => ({ title: `Task ${i}` })),
      habits: Array.from({ length: 25 }, (_, i) => ({ name: `Habit ${i}` })),
    };
    const sanitized = sanitizeContext(context);
    expect(sanitized.safeTasks.length).toBe(20);
    expect(sanitized.safeHabits.length).toBe(20);
  });
});
