import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("Chart security sanitization", () => {
  let originalResizeObserver: typeof window.ResizeObserver;

  beforeAll(() => {
    originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
  });

  it("sanitizes malicious chart ID attributes and selectors", () => {
    const maliciousId = 'unsafe" style="color:red" <script>alert(1)</script>';
    const config: ChartConfig = {
      views: {
        label: "Views",
        color: "hsl(10, 20%, 30%)",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("<script>");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).toMatch(/^chart-[a-zA-Z0-9_-]+$/);

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).not.toContain("<script>");
    expect(styleTag?.textContent).not.toContain('"');
  });

  it("sanitizes malicious config keys in CSS custom properties", () => {
    const config: ChartConfig = {
      'badKey} body { background: red; }': {
        label: "Malicious Key",
        color: "#123456",
      },
      validKey: {
        label: "Valid Key",
        color: "#abcdef",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("badKey}");
    expect(styleTag?.textContent).not.toContain("body { background: red; }");
    expect(styleTag?.textContent).toContain("--color-validKey: #abcdef;");
  });

  it("blocks CSS injection and url() tracking pixels in color values", () => {
    const config: ChartConfig = {
      trackingPixel: {
        label: "SSRF Attempt",
        color: 'url("http://attacker.com/leak.png")',
      },
      cssBreakout: {
        label: "Breakout Attempt",
        color: "red; } body { background: red; }",
      },
      validColor: {
        label: "Safe Color",
        color: "hsl(120, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.textContent).not.toContain("http://attacker.com");
    expect(styleTag?.textContent).not.toContain("--color-trackingPixel");
    expect(styleTag?.textContent).not.toContain("body { background: red; }");
    expect(styleTag?.textContent).not.toContain("--color-cssBreakout");
    expect(styleTag?.textContent).toContain("--color-validColor: hsl(120, 50%, 50%);");
  });
});
