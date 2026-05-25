import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "../components/ui/chart";
import * as React from "react";

// Mock ResizeObserver which is required by Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Chart Security", () => {
  it("sanitizes chart ID to prevent CSS injection", () => {
    const maliciousId = 'my-chart"; } body { background: red; } /*';
    const config = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    const chartId = chartDiv?.getAttribute("data-chart");

    // The malicious ID should be sanitized
    expect(chartId).not.toContain('"');
    expect(chartId).not.toContain(";");
    expect(chartId).not.toContain("{");

    // Check if the style tag contains the sanitized ID and is quoted
    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).toContain(`[data-chart="${chartId}"]`);
    expect(styleTag?.innerHTML).not.toContain(maliciousId);
  });

  it("sanitizes config keys and colors to prevent CSS injection", () => {
    const config = {
      'invalid-key"; } body { background: red; } /*': {
        label: "Test",
        color: 'blue; } body { background: red; } /*'
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // The malicious key and color should be sanitized
    expect(styleContent).not.toContain('invalid-key";');
    expect(styleContent).not.toContain('blue;');
    // It should not contain the injected body rule
    expect(styleContent).not.toContain("body { background: red; }");
  });
});
