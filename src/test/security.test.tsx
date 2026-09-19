import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "../components/ui/chart";

// Mock ResizeObserver for Recharts / ResponsiveContainer in testing environment
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious id attributes to prevent CSS/DOM breakout", () => {
    const maliciousId = 'test" [data-chart="breakout"] { background: red; }';
    const config: ChartConfig = {
      views: { label: "Views", color: "#10b981" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");

    // Must strip quotes, spaces, brackets, and semicolons (preserving valid identifier chars alphanumeric, dash, underscore)
    expect(dataChartAttr).toBe("chart-testdata-chartbreakoutbackgroundred");

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    expect(styleElement?.innerHTML).not.toContain('test"');
    expect(styleElement?.innerHTML).toContain("chart-testdata-chartbreakoutbackgroundred");
  });

  it("sanitizes malicious CSS property keys in ChartConfig", () => {
    const config: ChartConfig = {
      'views; } body { background: red; } --foo': {
        label: "Views",
        color: "#10b981",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.innerHTML || "";

    expect(cssContent).not.toContain("body { background: red; }");
    expect(cssContent).toContain("--color-viewsbodybackgroundred--foo: #10b981;");
  });

  it("sanitizes malicious CSS color values including breaking characters and url() payload", () => {
    const config: ChartConfig = {
      maliciousColorWithUrl: {
        label: "Malicious Color",
        color: 'red; } body { background: url("http://evil.com/leak.png"); }',
      },
      maliciousColorBreakout: {
        label: "Breakout Color",
        color: 'red; } body { background: blue; }',
      },
      urlColor: {
        label: "Tracking URL",
        color: "url('https://tracker.com/pixel.gif')",
      },
      validColor: {
        label: "Valid Color",
        color: "#3b82f6",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.innerHTML || "";

    // Check that url(...) construct is completely blocked and omitted
    expect(cssContent).not.toContain("tracker.com");
    expect(cssContent).not.toContain("evil.com");
    expect(cssContent).not.toContain("url(");

    // Check that semicolon / rule breakout is stripped for non-url breakout
    expect(cssContent).not.toContain("body {");
    expect(cssContent).toContain("--color-maliciousColorBreakout: red  body  background: blue ;");

    // Check valid color preserved
    expect(cssContent).toContain("--color-validColor: #3b82f6;");
  });
});
