import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious chart ID attributes and data-chart selectors", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const maliciousId = 'test"}</style><script>alert(1)</script>';

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");

    // Must strip special characters and HTML/CSS breakouts
    expect(dataChartAttr).toBe("chart-teststylescriptalert1script");
    expect(container.innerHTML).not.toContain("<script>alert(1)</script>");
  });

  it("sanitizes malicious CSS keys and color values including url() SSRF payloads", () => {
    const config: ChartConfig = {
      'invalid;key"': {
        label: "Malicious Key",
        color: 'red; } body { background: url("http://malicious.com/leak") }',
      },
      ssrfKey: {
        label: "SSRF Key",
        color: 'url("http://attacker.com/tracking.png")',
      },
      validKey: {
        label: "Valid Key",
        color: "hsl(215 20.2% 65.1%)",
      },
    };

    const { container } = render(
      <ChartContainer id="sec-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    // Malicious color payloads with url() or breakout characters should be completely omitted
    expect(styleContent).not.toContain("invalid;key");
    expect(styleContent).not.toContain("http://malicious.com/leak");
    expect(styleContent).not.toContain("http://attacker.com/tracking.png");

    // Valid HSL color syntax should be preserved
    expect(styleContent).toContain("--color-validKey: hsl(215 20.2% 65.1%)");
  });
});
