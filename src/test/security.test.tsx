import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";
import React from "react";

// Mock ResizeObserver which is needed by Recharts ResponsiveContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("Chart Security and Sanitization", () => {
  it("should sanitize malicious IDs and block breakout attempts", () => {
    const maliciousId = `malicious-id" { background: red; } /*`;
    const config = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Test Chart</div>
      </ChartContainer>
    );

    // The data-chart attribute on the container should be sanitized
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain('{');
    expect(dataChartAttr).toBe("chart-malicious-idbackgroundred");
  });

  it("should sanitize config keys and color values in ChartStyle", () => {
    const config = {
      "desktop; color: red; } /*": {
        label: "Desktop",
        color: `hsl(210, 100%, 50%); background-image: url('http://malicious.com'); /*`,
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div>Test Chart</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.textContent || "";

    // Semicolons and curly braces must be stripped from the color
    expect(styleContent).not.toContain("; background-image: url(");
    expect(styleContent).not.toContain("/*");

    // Key should be sanitized (the semicolon must be stripped)
    expect(styleContent).toContain("--color-desktopcolorred");
  });
});
