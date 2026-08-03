import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / test execution
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock;
});

describe("ChartContainer Security & Sanitization", () => {
  it("should sanitize malicious container id to prevent CSS injection", () => {
    const maliciousId = "chart-id;}[data-chart=injected]{background:red}";
    const config: ChartConfig = {
      sales: {
        label: "Sales",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Mock Chart Content</div>
      </ChartContainer>
    );

    // The data-chart attribute on the container should be sanitized
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");

    // Malicious characters (semicolon, brackets, braces) should be stripped out
    expect(dataChartAttr).not.toContain(";");
    expect(dataChartAttr).not.toContain("}");
    expect(dataChartAttr).not.toContain("{");

    // It should have matched alphanumeric/hyphen/underscore whitelist
    expect(dataChartAttr).toBe("chart-chart-iddata-chartinjectedbackgroundred");
  });

  it("should sanitize malicious config keys to prevent CSS property name injection", () => {
    const maliciousKey = "sales;--malicious:red";
    const config: ChartConfig = {
      [maliciousKey]: {
        label: "Sales",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div>Mock Chart Content</div>
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.textContent || styleTag?.innerHTML || "";

    // The malicious property name should be sanitized and keep only alphanumeric/hyphen/underscore
    expect(styleContent).not.toContain("sales;--malicious");
    expect(styleContent).toContain("--color-sales--maliciousred");
  });

  it("should sanitize malicious color values to prevent CSS breakout rules", () => {
    const maliciousColor = "red; background: url('javascript:alert(1)')";
    const config: ChartConfig = {
      sales: {
        label: "Sales",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div>Mock Chart Content</div>
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.textContent || styleTag?.innerHTML || "";

    // Verify that the color input value itself was stripped of semicolon and single quotes
    // so it doesn't close the CSS variable declaration or inject a new rule.
    expect(styleContent).not.toContain("red;");
    expect(styleContent).not.toContain("'");
    expect(styleContent).toContain("red background: url(javascript:alert(1))");
  });

  it("should preserve valid CSS color values like hsl and rgb functions", () => {
    const hslColor = "hsl(215, 15%, 25%)";
    const config: ChartConfig = {
      sales: {
        label: "Sales",
        color: hslColor,
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div>Mock Chart Content</div>
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.textContent || styleTag?.innerHTML || "";

    // Parantheses, commas, and percentage should be preserved
    expect(styleContent).toContain("hsl(215, 15%, 25%)");
  });
});
