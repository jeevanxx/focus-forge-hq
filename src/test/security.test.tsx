import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Chart security sanitization", () => {
  test("sanitizes chart id to prevent DOM/attribute injection", () => {
    const maliciousConfig: ChartConfig = {
      sales: { label: "Sales", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id='id" breakout="true"' config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-idbreakouttrue");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain(" ");
  });

  test("sanitizes CSS keys and blocks url() and breakout characters in color styles", () => {
    const maliciousConfig: ChartConfig = {
      'bad_key; } body { color: red } /*': {
        label: "Malicious Key",
        color: 'red; } body { background: blue } /*',
      },
      trackingPixel: {
        label: "SSRF Leak",
        color: 'url("https://attacker.com/leak.png")',
      },
      safeMetric: {
        label: "Safe Metric",
        color: "hsl(210, 100%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="sec-test" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML || "";

    // Should not contain injected CSS rules or breakout semicolons/brackets
    expect(styleContent).not.toContain("body { color: red }");
    expect(styleContent).not.toContain("body { background: blue }");

    // Should block url() construct to prevent SSRF / tracking pixel leak
    expect(styleContent).not.toContain("https://attacker.com/leak.png");
    expect(styleContent).not.toContain("url(");

    // Should preserve valid safe color property
    expect(styleContent).toContain("--color-safeMetric: hsl(210, 100%, 50%);");
  });
});
