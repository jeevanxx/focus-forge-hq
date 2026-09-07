import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

describe("Chart Security Sanitization", () => {
  beforeAll(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  it("sanitizes malicious chart id to prevent DOM selector and CSS injection", () => {
    const maliciousId = 'test-id"><script>alert(1)</script>';
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("<script>");
    expect(dataChartAttr).not.toContain('">');
    expect(dataChartAttr).toBe("chart-test-idscriptalert1script");

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("<script>");
    expect(styleEl?.innerHTML).toContain("[data-chart=chart-test-idscriptalert1script]");
  });

  it("sanitizes malicious config keys and color values, blocking CSS breakouts and url() constructs", () => {
    const config: ChartConfig = {
      "bad;key": {
        label: "Bad Key",
        color: "red; } body { background: blue; }",
      },
      urlKey: {
        label: "URL Key",
        color: 'url("http://attacker.com")',
      },
      validKey: {
        label: "Valid Key",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.innerHTML || "";

    // key should be sanitized to remove semicolon
    expect(styleContent).not.toContain("--color-bad;key");
    expect(styleContent).toContain("--color-badkey:");

    // breakout characters ({ and }) should be removed from color
    expect(styleContent).not.toContain("body { background: blue; }");
    expect(styleContent).toContain("--color-badkey: red  body  background: blue;");

    // color with url() should be rejected
    expect(styleContent).not.toContain("http://attacker.com");
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("--color-urlKey");

    // valid color should be preserved
    expect(styleContent).toContain("--color-validKey: hsl(var(--primary));");
  });
});
