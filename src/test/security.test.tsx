import { describe, test, expect, beforeAll } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "../components/ui/chart";

beforeAll(() => {
  // Mock ResizeObserver for Recharts / JSDOM environment safely
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Chart security sanitization", () => {
  test("sanitizes malicious id in ChartContainer", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id='test" style="color:red"' config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-teststylecolorred");

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain("[data-chart=chart-teststylecolorred]");
  });

  test("sanitizes malicious config keys to prevent CSS property breakout", () => {
    const config: ChartConfig = {
      'badKey; } body { background: red; }': { label: "Bad", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id="sec-test-key" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("body { background: red; }");
    expect(styleTag?.textContent).toContain("--color-badKeybodybackgroundred: #2563eb");
  });

  test("blocks CSS breakout characters in color values", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "red; } body { display: none; }" },
    };

    const { container } = render(
      <ChartContainer id="sec-test-color" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("body { display: none; }");
    expect(styleTag?.textContent).not.toContain("--color-desktop");
  });

  test("blocks url() constructs in color values to prevent SSRF and tracking pixel leaks", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "url('https://attacker.com/pixel.png')" },
    };

    const { container } = render(
      <ChartContainer id="sec-test-url" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("attacker.com");
    expect(styleTag?.textContent).not.toContain("--color-desktop");
  });

  test("preserves valid CSS colors and variables", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(var(--primary))" },
      mobile: { label: "Mobile", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id="sec-test-valid" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).toContain("--color-desktop: hsl(var(--primary));");
    expect(styleTag?.textContent).toContain("--color-mobile: #2563eb;");
  });
});
