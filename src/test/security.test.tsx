import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("Chart Container Security - CSS Injection Sanitization", () => {
  it("sanitizes malicious color inputs blocking CSS rules breakouts and url() constructs", () => {
    const config: ChartConfig = {
      maliciousBreakout: {
        label: "Malicious Rule Breakout",
        color: "red; } body { display: none; }",
      },
      maliciousUrl: {
        label: "Malicious SSRF URL",
        color: "url('https://malicious.com/pixel.png')",
      },
      validHsl: {
        label: "Valid HSL",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer config={config} id="test-id">
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    // Check that CSS breakout characters (`;`, `{`, `}`) were stripped
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("--color-maliciousBreakout: red  body  display: none;");

    // Check that url() constructs are completely stripped
    expect(styleContent).not.toContain("https://malicious.com/pixel.png");
    expect(styleContent).not.toContain("--color-maliciousUrl");

    // Check that valid color definitions remain preserved
    expect(styleContent).toContain("--color-validHsl: hsl(var(--primary));");
  });

  it("sanitizes malicious ID attributes in ChartContainer", () => {
    const config: ChartConfig = {
      series1: {
        label: "Series 1",
        color: "#ff0000",
      },
    };

    const maliciousId = "unsafe-id'\"<script>alert(1)</script>";

    const { container } = render(
      <ChartContainer config={config} id={maliciousId}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const wrapperDiv = container.querySelector("[data-chart]");
    expect(wrapperDiv).not.toBeNull();

    const chartAttr = wrapperDiv?.getAttribute("data-chart");
    expect(chartAttr).not.toContain("<script>");
    expect(chartAttr).not.toContain("'");
    expect(chartAttr).not.toContain('"');
    expect(chartAttr).toBe("chart-unsafe-idscriptalert1script");

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.innerHTML || "";
    expect(styleContent).toContain("[data-chart=chart-unsafe-idscriptalert1script]");
  });

  it("sanitizes malicious key names in ChartConfig", () => {
    const config: ChartConfig = {
      "series; } bad-selector { color: red": {
        label: "Bad Key",
        color: "#00ff00",
      },
    };

    const { container } = render(
      <ChartContainer config={config} id="clean-id">
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("bad-selector {");
    expect(styleContent).toContain("--color-seriesbad-selectorcolorred: #00ff00;");
  });
});
