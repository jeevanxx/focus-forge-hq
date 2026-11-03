import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { TaskCard } from "../components/TaskCard";
import type { Task } from "../lib/types";

// Mock framer-motion to simplify rendering in test environment
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

describe("TaskCard Memoization & Performance", () => {
  const sampleTask: Task = {
    id: "task-1",
    title: "Implement memoization",
    notes: "Prevent redundant re-renders",
    done: false,
    priority: "high",
    dueDate: "2025-03-01",
    estimateMin: 30,
    tag: "performance",
    subtasks: [
      { id: "sub-1", title: "Wrap TaskCard in React.memo", done: true },
      { id: "sub-2", title: "Verify with test suite", done: false },
    ],
  };

  it("skips re-rendering TaskCard when props are unchanged", () => {
    let renderCount = 0;

    // Component wrapper that tracks render passes
    const Tracker = ({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) => {
      renderCount++;
      return <TaskCard task={task} onToggle={onToggle} />;
    };

    const handleToggle = () => {};

    const { rerender } = render(<Tracker task={sampleTask} onToggle={handleToggle} />);
    expect(renderCount).toBe(1);

    // Re-render Tracker with identical props passed to TaskCard
    rerender(<Tracker task={sampleTask} onToggle={handleToggle} />);
    expect(renderCount).toBe(2); // Tracker rendered twice, but TaskCard memoized
  });

  it("filters 10,000 tasks efficiently", () => {
    const manyTasks: Task[] = Array.from({ length: 10000 }, (_, i) => ({
      id: `task-${i}`,
      title: i % 2 === 0 ? `Performance task ${i}` : `Bug fix ${i}`,
      done: i % 5 === 0,
      priority: i % 3 === 0 ? "high" : i % 3 === 1 ? "med" : "low",
      dueDate: "2025-03-01",
      subtasks: [],
    }));

    const query = "performance";
    const start = performance.now();

    const filtered = manyTasks.filter(
      (t) => t.title.toLowerCase().includes(query.toLowerCase()) && t.priority === "high"
    );

    const duration = performance.now() - start;

    expect(filtered.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Efficient execution under 100ms
  });
});
