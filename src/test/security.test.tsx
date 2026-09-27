import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id attribute to prevent CSS selector injection", () => {
    const maliciousId = 'test"; } body { color: red; }';
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "red" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-testbodycolorred");

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).toContain("[data-chart=chart-testbodycolorred]");
    expect(styleEl?.innerHTML).not.toContain('test"; } body { color: red; }');
  });

  test("sanitizes malicious config keys to prevent CSS variable breakout", () => {
    const maliciousConfig: ChartConfig = {
      'badKey}; body { display: none; }': { label: "Bad", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer config={maliciousConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("badKey};");
    expect(styleEl?.innerHTML).toContain("--color-badKeybodydisplaynone:");
  });

  test("sanitizes malicious color values containing CSS breakout characters", () => {
    const maliciousColorConfig: ChartConfig = {
      views: { label: "Views", color: "red; } body { background: black; }" },
    };

    const { container } = render(
      <ChartContainer config={maliciousColorConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("; } body {");
    expect(styleEl?.innerHTML).toContain("--color-views: red  body  background: black");
  });

  test("blocks CSS url() constructs to prevent SSRF and tracking pixel leaks", () => {
    const trackingUrlConfig: ChartConfig = {
      clicks: { label: "Clicks", color: "url('https://evil.com/pixel.png')" },
    };

    const { container } = render(
      <ChartContainer config={trackingUrlConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("https://evil.com/pixel.png");
    expect(styleEl?.innerHTML).not.toContain("--color-clicks:");
  });

  test("preserves valid color syntaxes like hsl, rgb, and hex", () => {
    const validConfig: ChartConfig = {
      sales: { label: "Sales", color: "hsl(var(--primary))" },
      users: { label: "Users", color: "#123456" },
    };

    const { container } = render(
      <ChartContainer config={validConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).toContain("--color-sales: hsl(var(--primary));");
    expect(styleEl?.innerHTML).toContain("--color-users: #123456;");
  });
});
