import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver which is needed by Recharts ResponsiveContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("Chart Security and Sanitization", () => {
  it("should sanitize the container id and prevent CSS/HTML breakout", () => {
    const maliciousId = `malicious-id" onload="alert(1)" style="color:red`;
    const config: ChartConfig = {
      test: {
        label: "Test",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    // Get the element with data-chart attribute
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartValue = chartDiv?.getAttribute("data-chart");

    // The double quotes and onload payload should be stripped or removed
    expect(dataChartValue).not.toContain('"');
    expect(dataChartValue).not.toContain("style=");
    // Only safe characters should be preserved (alphanumeric, dashes, underscores)
    expect(dataChartValue).toBe("chart-malicious-idonloadalert1stylecolorred");
  });

  it("should sanitize keys and color values in ChartStyle to prevent CSS injection", () => {
    const maliciousConfig: ChartConfig = {
      // Key with breakout characters
      "maliciousKey; } body { background: red; } /*": {
        label: "Malicious Key",
        color: `red; } body { background: blue; } /*`,
      },
    };

    const { container } = render(
      <ChartContainer id="secure-chart" config={maliciousConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML;

    // Verify key breakout characters like semicolon and closing brackets are sanitized
    expect(styleContent).not.toContain("maliciousKey;");

    // Check that we don't have injected body styles
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("body { background: blue; }");

    // Semicolons and curly braces in the input color value must be stripped
    // While the generated style tag has structural block curly braces and CSS declaration semicolons:
    // "  --color-maliciousKeybodybackgroundred: red  body  background: blue  /*;"
    expect(styleContent).toContain("--color-maliciousKeybodybackgroundred: red  body  background: blue  /*;");
  });
});
