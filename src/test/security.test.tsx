import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Security Sanitization Tests for Chart Components", () => {
  test("sanitizes malicious chart ID against DOM/HTML injection", () => {
    const maliciousId = 'test"><script>alert("xss")</script>';
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-testscriptalertxssscript");
    expect(dataChartAttr).not.toContain("<");
    expect(dataChartAttr).not.toContain(">");
    expect(dataChartAttr).not.toContain('"');

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain("[data-chart=chart-testscriptalertxssscript]");
  });

  test("sanitizes config key names to prevent CSS property breakout", () => {
    const config: ChartConfig = {
      'desktop; } body { background: red; } .foo': { label: "Desktop", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.textContent).toContain("--color-desktopbodybackgroundredfoo: #2563eb;");
    expect(styleEl?.textContent).not.toContain("; } body");
  });

  test("sanitizes color values to prevent CSS injection and breakout", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(200, 50%, 50%); } body { display: none !important; }" },
    };

    const { container } = render(
      <ChartContainer id="color-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.textContent).toContain("--color-desktop: hsl(200, 50%, 50%)  body  display: none !important;");
    expect(styleEl?.textContent).not.toContain("; }");
    expect(styleEl?.textContent).not.toContain("{ display");
  });

  test("filters out url() constructs in color to prevent SSRF and tracking pixel leaks", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: 'url("https://attacker.com/pixel.png")' },
    };

    const { container } = render(
      <ChartContainer id="pixel-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.textContent).not.toContain("https://attacker.com/pixel.png");
    expect(styleEl?.textContent).not.toContain("url(");
  });
});
