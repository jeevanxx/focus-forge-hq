import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / ChartContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  it("sanitizes malicious container IDs to prevent CSS selector injection", () => {
    const maliciousId = 'test-id" { background: red; }';
    const config: ChartConfig = {
      series1: { label: "Series 1", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain('{');
    expect(dataChartAttr).toBe("chart-test-idbackgroundred");

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain("[data-chart=chart-test-idbackgroundred]");
    expect(styleTag?.textContent).not.toContain('{ background: red; } [data-chart=');
  });

  it("sanitizes malicious config key names to prevent invalid CSS custom properties", () => {
    const config: ChartConfig = {
      'series1"; } body { background: red; }--x': { label: "Series 1", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("body { background: red; }");
    expect(styleTag?.textContent).toContain("--color-series1bodybackgroundred--x: #ff0000;");
  });

  it("sanitizes dangerous CSS breakout characters in color definitions", () => {
    const config: ChartConfig = {
      primary: { label: "Primary", color: 'red; } body { background: black; } "' },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("body { background: black; }");
    expect(styleTag?.textContent).toContain("--color-primary: red  body  background: black;");
  });

  it("blocks url() constructs in colors to prevent SSRF and tracking pixel leaks", () => {
    const config: ChartConfig = {
      tracking: { label: "Tracking", color: 'url("https://malicious.com/pixel.png")' },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("https://malicious.com/pixel.png");
    expect(styleTag?.textContent).not.toContain("--color-tracking:");
  });
});
