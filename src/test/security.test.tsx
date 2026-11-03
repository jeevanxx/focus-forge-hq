import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

describe("ChartContainer Security & Sanitization", () => {
  beforeEach(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });

  it("sanitizes malicious id, config key, and color to prevent CSS injection and XSS", () => {
    const maliciousConfig: ChartConfig = {
      "desktop; } body { background: red; }": {
        label: "Desktop",
        color: "hsl(10, 50%, 50%); } body { display: none; }",
      },
    };

    const { container } = render(
      <ChartContainer id='test-chart; </style><script>alert(1)</script>' config={maliciousConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart") || "";
    expect(dataChartAttr).toBe("chart-test-chartstylescriptalert1script");
    expect(dataChartAttr).not.toContain(";");
    expect(dataChartAttr).not.toContain("<script>");

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Key sanitization: breakout characters should be removed
    expect(styleContent).not.toContain("desktop; } body");
    expect(styleContent).toContain("--color-desktopbodybackgroundred");

    // Color sanitization: breakout characters should be removed
    expect(styleContent).not.toContain("; } body { display: none; }");
    expect(styleContent).toContain("hsl(10, 50%, 50%)  body  display: none ");
  });

  it("blocks url() constructs in color values to prevent SSRF and tracking pixel leaks", () => {
    const ssrfConfig: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: 'url("https://attacker.com/leak.png")',
      },
    };

    const { container } = render(
      <ChartContainer id="ssrf-test" config={ssrfConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    // Since color is blocked (returns empty string), no valid CSS rules are emitted for desktop
    const styleContent = styleElement?.innerHTML || "";
    expect(styleContent).not.toContain("attacker.com");
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("--color-desktop");
  });
});
