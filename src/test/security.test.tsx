import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  it("sanitizes malicious id attribute and style selector", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const maliciousId = 'my-chart"><script>alert("xss")</script>';
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-my-chartscriptalertxssscript");
    expect(dataChartAttr).not.toContain("<");
    expect(dataChartAttr).not.toContain(">");
    expect(dataChartAttr).not.toContain('"');

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).toContain("[data-chart=chart-my-chartscriptalertxssscript]");
    expect(styleEl?.innerHTML).not.toContain("<script>");
  });

  it("sanitizes malicious config keys and color values including url() constructs", () => {
    const maliciousConfig: ChartConfig = {
      "bad;key}": { label: "Bad Key", color: "red; } body { background: red; }" },
      "ssrfKey": { label: "SSRF Key", color: 'url("http://evil.com/leak.png")' },
      "validKey": { label: "Valid Key", color: "hsl(12, 100%, 50%)" },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleText = styleEl?.innerHTML || "";

    // key bad;key} should be sanitized to badkey
    expect(styleText).toContain("--color-badkey:");

    // color red; } body { background: red; } should have breakout characters removed
    expect(styleText).toContain("--color-badkey: red  body  background: red ;");
    expect(styleText).not.toContain("; } body {");
    expect(styleText).not.toContain("body {");

    // url() construct should be blocked completely resulting in empty/omitted string
    expect(styleText).not.toContain("http://evil.com");
    expect(styleText).not.toContain("url(");

    // valid hsl color should remain intact
    expect(styleText).toContain("--color-validKey: hsl(12, 100%, 50%)");
  });
});
