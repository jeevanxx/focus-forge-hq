import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe("Chart Security Sanitization", () => {
  test("sanitizes malicious id, config key, and color values", () => {
    const maliciousConfig: ChartConfig = {
      "malicious;key": {
        label: "Malicious Key",
        color: "hsl(200, 50%, 50%); } body { display: none; }",
      },
      urlKey: {
        label: "URL Key",
        color: 'url("https://attacker.com/leak.png")',
      },
      validKey: {
        label: "Valid Key",
        color: "#ff0000",
      },
    };

    const { container } = render(
      <ChartContainer id="test]<script>alert(1)</script>" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    // Verify data-chart attribute on container
    const chartDiv = container.querySelector("div[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBe("chart-testscriptalert1script");

    // Verify style element contents
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleText = styleElement?.innerHTML || "";

    // HTML / CSS breakouts should be sanitized
    expect(styleText).not.toContain("<script>");
    expect(styleText).not.toContain("body { display: none; }");
    expect(styleText).not.toContain('url("https://attacker.com/leak.png")');

    // Valid key and sanitized color should be present
    expect(styleText).toContain("--color-maliciouskey: hsl(200, 50%, 50%)");
    expect(styleText).toContain("--color-validKey: #ff0000");
  });
});
