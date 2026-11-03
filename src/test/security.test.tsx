import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";

describe("Chart sanitization security tests", () => {
  beforeAll(() => {
    if (typeof window !== "undefined" && !window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
    }
  });

  it("sanitizes malicious chart ID to prevent HTML/CSS breakout", () => {
    const maliciousId = 'test"</span><script>alert("xss")</script>';
    const config = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
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
    expect(dataChartAttr).toBe("chart-testspanscriptalertxssscript");

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("<script>");
  });

  it("sanitizes malicious config keys and colors to prevent CSS injection and SSRF", () => {
    const config = {
      'bad";key': {
        label: "Bad Key",
        color: "red; background: url('http://evil.com/leak')",
      },
      normal: {
        label: "Normal",
        color: "hsl(120, 100%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const cssText = styleEl?.innerHTML || "";

    // Should strip semicolons/quotes/url() from color and bad chars from key
    expect(cssText).not.toContain('bad";key');
    expect(cssText).not.toContain("url(");
    expect(cssText).not.toContain("http://evil.com");
    expect(cssText).toContain("--color-normal: hsl(120, 100%, 50%);");
  });
});
