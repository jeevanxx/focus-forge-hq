import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartStyle } from "@/components/ui/chart";
import React from "react";

describe("Chart Security", () => {
  it("sanitizes the id prop in ChartStyle", () => {
    const maliciousId = 'my-chart"; breakout: "evil';
    const config = {
      test: { label: "Test", color: "red" }
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleTag = container.querySelector("style");

    expect(styleTag).not.toBeNull();
    const content = styleTag?.innerHTML || "";

    // The malicious characters should be removed from the ID
    // sanitizeId removes [^a-zA-Z0-9-_]
    // 'my-chart"; breakout: "evil' -> 'my-chartbreakoutevil'
    expect(content).not.toContain('my-chart"; breakout: "evil');
    expect(content).toContain('data-chart="my-chartbreakoutevil"');
  });

  it("sanitizes config keys and colors in ChartStyle", () => {
    const config = {
      "bad;key": { label: "Bad", color: 'red; background: url("evil.com")' }
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleTag = container.querySelector("style");

    const content = styleTag?.innerHTML || "";

    // Key should be sanitized
    expect(content).toContain("--color-badkey");
    // Color should be sanitized (semicolons, quotes, etc removed)
    expect(content).toContain("red background: url(evil.com)");
  });

  it("sanitizes the id prop in ChartContainer", () => {
    const maliciousId = '"><script>alert(1)</script>';
    const config = {
      test: { label: "Test", color: "red" }
    };

    // We need to mock ResponsiveContainer because it might fail in jsdom if not careful,
    // but here we just want to see the wrapper div
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChart = chartDiv?.getAttribute("data-chart");

    // it should start with 'chart-' and then sanitized id
    // "><script>alert(1)</script> -> scriptalert1script
    expect(dataChart).toBe("chart-scriptalert1script");
  });
});
