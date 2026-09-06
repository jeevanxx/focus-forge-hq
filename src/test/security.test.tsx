import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id in chart data attributes and style tags", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#10b981" },
    };
    const maliciousId = `my-chart"] { color: red; } <script>alert(1)</script>`;

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain(']');
    expect(dataChartAttr).not.toContain('<script>');
    expect(dataChartAttr).toBe("chart-my-chartcolorredscriptalert1script");

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain('data-chart=my-chart"]');
    expect(styleEl?.innerHTML).not.toContain("<script>");
  });

  test("sanitizes malicious config keys in CSS custom properties", () => {
    const config: ChartConfig = {
      "desktop; } body { display:none }": { label: "Desktop", color: "#10b981" },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("body { display:none }");
    expect(styleEl?.innerHTML).toContain("--color-desktopbodydisplaynone: #10b981;");
  });

  test("blocks CSS breakout attempts and HTML script injection in color values", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: `red; } </style><script>alert(1)</script>` },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML ?? "").not.toContain("<script>");
    expect(styleEl?.innerHTML ?? "").not.toContain("--color-desktop: red; }");
  });

  test("blocks SSRF and tracking pixel leaks using url() in color values", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "url('https://evil.com/leak.png')" },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML ?? "").not.toContain("evil.com");
    expect(styleEl?.innerHTML ?? "").not.toContain("--color-desktop:");
  });

  test("preserves valid CSS color values like hex, hsl(), rgb(), and CSS variables", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(var(--primary))" },
      mobile: { label: "Mobile", color: "#10b981" },
    };

    const { container } = render(
      <ChartContainer id="valid-chart" config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).toContain("--color-desktop: hsl(var(--primary));");
    expect(styleEl?.innerHTML).toContain("--color-mobile: #10b981;");
  });
});
