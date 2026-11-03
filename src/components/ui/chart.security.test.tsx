import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChartContainer } from "./chart";
import * as React from "react";

// Mock recharts to avoid rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("ChartContainer Security", () => {
  it("sanitizes the chart ID to prevent CSS injection", () => {
    const maliciousId = 'my-chart"]; } body { background: red; } /*';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{}}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    const chartId = chartDiv?.getAttribute("data-chart");

    // The malicious characters like ";", "}", etc. should be removed
    // Based on the regex /[^a-zA-Z0-9-_]/g
    expect(chartId).not.toContain('"]');
    expect(chartId).not.toContain(";");
    expect(chartId).not.toContain("}");
    expect(chartId).toBe("chart-my-chartbodybackgroundred");
  });

  it("sanitizes config keys and colors in ChartStyle", () => {
    const maliciousKey = "key; } body { background: red; } /*";
    const maliciousColor = "red; } body { background: blue; } /*";

    const config = {
      [maliciousKey]: {
        label: "Test",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML;

    // Check if the malicious content is sanitized in the style tag
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("body { background: blue; }");

    // The characters ; { } < > \ should be removed
    expect(styleContent).toContain("--color-keybodybackgroundred");
    expect(styleContent).toContain("red  body  background: blue  /*");

    // Ensure data-chart attribute in CSS is quoted
    expect(styleContent).toContain('[data-chart="chart-test"]');
  });
});
