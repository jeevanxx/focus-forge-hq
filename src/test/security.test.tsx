import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

describe("ChartContainer Security Sanitization", () => {
  beforeAll(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  it("sanitizes malicious id to prevent HTML and CSS breakout", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id='malicious" style="background:red' config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-maliciousstylebackgroundred");

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).toContain("[data-chart=chart-maliciousstylebackgroundred]");
    expect(styleEl?.innerHTML).not.toContain('malicious" style="background:red');
  });

  it("sanitizes malicious config keys to prevent CSS injection", () => {
    const config: ChartConfig = {
      "desktop} body { color: red; }": {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test-key" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).toContain("--color-desktopbodycolorred: hsl(var(--primary));");
    expect(styleEl?.innerHTML).not.toContain("desktop} body { color: red; }");
  });

  it("sanitizes malicious color values by stripping breakout characters", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "red; } body { display: none; }",
      },
    };

    const { container } = render(
      <ChartContainer id="test-color" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("body {");
    expect(styleEl?.innerHTML).not.toContain("body{");
    expect(styleEl?.innerHTML).toContain("--color-desktop: red  body  display: none ;");
  });

  it("blocks url() constructs in color values to prevent SSRF and tracking leaks", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "url('http://attacker.com/pixel.png')",
      },
    };

    const { container } = render(
      <ChartContainer id="test-url" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl?.innerHTML).not.toContain("http://attacker.com/pixel.png");
    expect(styleEl?.innerHTML).not.toContain("url(");
    expect(styleEl?.innerHTML).not.toContain("--color-desktop:");
  });
});
