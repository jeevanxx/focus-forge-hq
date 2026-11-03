import { render } from "@testing-library/react";
import { describe, test, expect, beforeAll } from "vitest";
import { ChartContainer } from "@/components/ui/chart";

beforeAll(() => {
  if (typeof window.ResizeObserver === "undefined") {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }
});

describe("Chart Security - CSS & HTML Injection Sanitization", () => {
  test("sanitizes malicious id, keys, and color values in ChartContainer", () => {
    const maliciousConfig = {
      "bad;key}": {
        color: "hsl(10, 50%, 50%); } body { background: red; } /*",
      },
      "urlKey": {
        color: "url('https://evil.com/leak.png') #000",
      },
      "validKey": {
        color: "#123456",
      },
    };

    const { container } = render(
      <ChartContainer id="chart-id] { body { display: none; } }" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    // 1. Verify id sanitization
    const chartWrapper = container.querySelector("[data-chart]");
    expect(chartWrapper).not.toBeNull();
    const dataChartAttr = chartWrapper?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-chart-idbodydisplaynone");

    // 2. Verify style content sanitization
    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // Breakout characters must be stripped from values and keys
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).not.toContain("; }");

    // url() constructs must be completely stripped to prevent SSRF / tracking pixel leaks
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("https://evil.com/leak.png");

    // Valid key and color should remain
    expect(styleContent).toContain("--color-validKey: #123456;");
  });
});
