import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChartContainer } from "../components/ui/chart";
import React from "react";

// Mock Recharts since we only care about the ChartStyle component
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("ChartContainer Security", () => {
  it("should sanitize id to prevent CSS injection", () => {
    const maliciousId = 'my-chart] { background: url("javascript:alert(1)") } .other [data-chart=xxx';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{ primary: { color: "blue" } }}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.innerHTML).not.toContain('background: url("javascript:alert(1)")');
  });

  it("should sanitize config keys to prevent CSS injection", () => {
    const maliciousKey = 'primary: 0; } [data-chart] { background: red; } --foo';
    const { container } = render(
      <ChartContainer config={{ [maliciousKey]: { color: "blue" } }}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.innerHTML).not.toContain("background: red");
  });
});
