import { render } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious id, config keys, and color values in style injection", () => {
    const maliciousId = 'test" style="background:red"';
    const maliciousConfig: ChartConfig = {
      'bad"key;': {
        label: "Bad Key",
        color: "red; } body { display: none; } --hack: ",
      },
      'url"key': {
        label: "URL key",
        color: 'url("https://attacker.com/tracking.png")',
      },
      validKey: {
        label: "Valid Key",
        color: "hsl(200, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={maliciousConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const chartElement = container.querySelector("[data-chart]");
    expect(chartElement).not.toBeNull();

    const chartAttr = chartElement?.getAttribute("data-chart");
    expect(chartAttr).toBe("chart-teststylebackgroundred");

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML || "";

    expect(styleContent).not.toContain('bad"key;');
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).not.toContain("; }");
    expect(styleContent).not.toContain('url("https://attacker.com/tracking.png")');

    expect(styleContent).toContain("--color-badkey: red  body  display: none  --hack: ");
    expect(styleContent).toContain("--color-validKey: hsl(200, 50%, 50%)");
  });
});
