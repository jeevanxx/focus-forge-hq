import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import React from "react";

// Mock framer-motion to avoid animation delays or issues in test environments
vi.mock("framer-motion", () => {
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, prop) => {
        // Return a mock component for any motion.X element
        return ({ children, whileHover, whileTap, ...props }: any) => {
          const Tag = prop as any;
          return <Tag {...props}>{children}</Tag>;
        };
      },
    }
  );
  return {
    motion: motionProxy,
  };
});

// Mock the components inside Dashboard that might have complex rendering or assets
vi.mock("@/components/FocusTimer", () => ({
  FocusTimer: () => <div data-testid="focus-timer">Mock FocusTimer</div>,
}));

vi.mock("@/components/TaskCard", () => ({
  TaskCard: ({ task }: any) => <div data-testid="task-card">{task.title}</div>,
}));

vi.mock("@/components/HabitRow", () => ({
  HabitRow: ({ habit }: any) => <div data-testid="habit-row">{habit.name}</div>,
}));

describe("Dashboard component optimization", () => {
  it("renders the main dashboard headings and sections correctly", () => {
    render(<Dashboard />);

    // Assert that the page greets the user
    expect(screen.getByText(/Good morning./i)).toBeInTheDocument();
    expect(screen.getByText(/Forge the day./i)).toBeInTheDocument();

    // Assert that the "Now working on" high priority section is visible
    expect(screen.getByText(/Now working on/i)).toBeInTheDocument();

    // Assert that mock sub-components are rendered
    expect(screen.getByTestId("focus-timer")).toBeInTheDocument();
  });
});
