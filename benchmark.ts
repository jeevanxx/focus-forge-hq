
import { getWeeklyFocus } from "./src/lib/analytics";
import { FocusSession } from "./src/lib/mock-data";

const generateSessions = (count: number): FocusSession[] => {
  const sessions: FocusSession[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    sessions.push({
      id: `s-${i}`,
      taskId: `t-${i % 10}`,
      date: date.toISOString(),
      durationMin: Math.floor(Math.random() * 60) + 10,
    });
  }
  return sessions;
};

const sessions = generateSessions(5000);
const now = new Date();

console.log(`Benchmarking getWeeklyFocus with ${sessions.length} sessions...`);
const start = performance.now();
for (let i = 0; i < 100; i++) {
  getWeeklyFocus(sessions, now);
}
const end = performance.now();
console.log(`Average time: ${((end - start) / 100).toFixed(2)}ms`);
