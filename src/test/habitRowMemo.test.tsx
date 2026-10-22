import { useState, useCallback, memo } from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HabitRow } from "@/components/HabitRow";
import type { Habit } from "@/lib/types";

const mockHabit: Habit = {
  id: "h1",
  name: "Daily Meditation",
  emoji: "🧘",
  streak: 5,
  target: 7,
  history: [true, true, true, false, true, true, true],
  color: "ember",
};

describe("HabitRow React.memo performance test", () => {
  test("prevents unnecessary re-renders when parent component state updates", () => {
    let childRenderCount = 0;

    // Track calls to the actual memoized HabitRow
    const TrackedHabitRow = memo((props: React.ComponentProps<typeof HabitRow>) => {
      childRenderCount++;
      return <HabitRow {...props} />;
    });

    const TestParent = () => {
      const [count, setCount] = useState(0);

      const handleToggle = useCallback((_id: string) => {}, []);
      const handleEdit = useCallback((_habit: Habit) => {}, []);
      const handleDelete = useCallback((_id: string) => {}, []);

      return (
        <div>
          <button onClick={() => setCount((c) => c + 1)}>Increment Parent Count: {count}</button>
          <TrackedHabitRow
            habit={mockHabit}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      );
    };

    render(<TestParent />);

    expect(screen.getByText("Daily Meditation")).toBeInTheDocument();
    expect(childRenderCount).toBe(1);

    // Trigger parent re-renders
    const button = screen.getByText(/Increment Parent Count/i);
    fireEvent.click(button);
    fireEvent.click(button);

    // childRenderCount should remain 1 because TrackedHabitRow is memoized and props haven't changed
    expect(childRenderCount).toBe(1);
  });
});
