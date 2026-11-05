import { describe, test, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id to prevent CSS selector and HTML breakout", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const maliciousId = 'chart-test"] { background: red; } </style><script>alert(1)</script>';

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>,
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("<script>");
    expect(dataChartAttr).not.toContain("]");
    expect(dataChartAttr).toBe("chart-chart-testbackgroundredstylescriptalert1script");

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("<script>");
    expect(styleEl?.innerHTML).not.toContain("background: red");
  });

  test("sanitizes malicious config keys to prevent CSS variable injection", () => {
    const maliciousConfig: ChartConfig = {
      "key; } body { display: none; }": { label: "Malicious Key", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={maliciousConfig}>
        <div />
      </ChartContainer>,
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("body { display: none; }");
    expect(styleEl?.innerHTML).toContain("--color-keybodydisplaynone:");
  });

  test("blocks CSS url() constructs and breakout characters in color values", () => {
    const maliciousColorConfig: ChartConfig = {
      desktop: { label: "Desktop", color: "url('http://attacker.com/leak.png')" },
      mobile: { label: "Mobile", color: "red; } body { display: none; }" },
      valid: { label: "Valid", color: "hsl(120, 100%, 50%)" },
    };

    const { container } = render(
      <ChartContainer id="color-test" config={maliciousColorConfig}>
        <div />
      </ChartContainer>,
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("http://attacker.com/leak.png");
    expect(styleEl?.innerHTML).not.toContain("body { display: none; }");
    expect(styleEl?.innerHTML).toContain("--color-valid: hsl(120, 100%, 50%);");
  });
});
