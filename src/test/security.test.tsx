import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "../components/ui/chart";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("Chart security sanitization", () => {
  it("sanitizes malicious IDs in ChartContainer data-chart attribute and style tags", () => {
    const maliciousId = 'malicious" style="background:red"';
    const config: ChartConfig = {
      test: { label: "Test", color: "hsl(100, 50%, 50%)" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-maliciousstylebackgroundred");

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    expect(styleTag?.innerHTML).toContain("[data-chart=chart-maliciousstylebackgroundred]");
    expect(styleTag?.innerHTML).not.toContain('"');
  });

  it("sanitizes malicious config keys and strips dangerous CSS breakout characters in colors", () => {
    const config: ChartConfig = {
      'bad"key;': {
        label: "Bad Key",
        color: "red; } body { background: red; }",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML || "";

    // Key should have special chars removed: 'bad"key;' -> 'badkey'
    expect(styleContent).toContain("--color-badkey:");
    // Color should have ';' and '{' and '}' removed
    expect(styleContent).not.toContain("; } body {");
  });

  it("blocks url() constructs in CSS color values to prevent tracking pixel / SSRF leaks", () => {
    const config: ChartConfig = {
      tracker: {
        label: "Tracker",
        color: 'url("https://attacker.com/leak.png")',
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");

    if (styleTag) {
      expect(styleTag.innerHTML).not.toContain("https://attacker.com/leak.png");
      expect(styleTag.innerHTML).not.toContain("--color-tracker");
    }
  });
});
