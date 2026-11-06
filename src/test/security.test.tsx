import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeEach(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious id in ChartContainer", () => {
    const config: ChartConfig = {
      test: { label: "Test", color: "red" },
    };

    const { container } = render(
      <ChartContainer id='test"> malicious' config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.firstElementChild as HTMLElement;
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-testmalicious");

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).toContain("[data-chart=chart-testmalicious]");
    expect(styleEl?.innerHTML).not.toContain('malicious"');
  });

  it("sanitizes CSS breakout characters and url() constructs in color values and keys", () => {
    const config: ChartConfig = {
      'bad"; key': { label: "Bad Key", color: 'red; } body { background: red; } "' },
      'ssrfKey': { label: "SSRF Key", color: 'url(https://attacker.com/leak.png)' },
      'validKey': { label: "Valid Key", color: 'hsl(120, 50%, 50%)' },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleCss = styleEl?.innerHTML || "";

    // Key bad"; key should be sanitized to badkey
    expect(styleCss).toContain("--color-badkey:");
    // Malicious color breakout characters ; { } " ' should be stripped
    expect(styleCss).not.toContain("body { background: red; }");
    expect(styleCss).not.toContain("; }");

    // url() should be completely blocked
    expect(styleCss).not.toContain("https://attacker.com/leak.png");
    expect(styleCss).not.toContain("--color-ssrfKey:");

    // Safe color like hsl(...) should be preserved
    expect(styleCss).toContain("--color-validKey: hsl(120, 50%, 50%);");
  });
});
