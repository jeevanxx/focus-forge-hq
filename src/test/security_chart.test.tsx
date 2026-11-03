import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";
import React from "react";

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("ChartContainer Security", () => {
  it("should sanitize the id to prevent CSS injection", () => {
    const maliciousId = '"><script>alert(1)</script><style>body{background:red}</style>';
    const config = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    const idAttr = chartDiv?.getAttribute("data-chart");

    // It should not contain characters like ", <, >
    expect(idAttr).not.toContain('"');
    expect(idAttr).not.toContain('<');
    expect(idAttr).not.toContain('>');
  });

  it("should sanitize config keys to prevent CSS injection", () => {
    const maliciousKey = 'test; } body { background: red; } .foo {';
    const config = {
      [maliciousKey]: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.textContent || "";

    // The malicious part should be sanitized or the property name should be safe
    expect(styleContent).not.toContain("body { background: red; }");
  });

  it("should sanitize color values to prevent CSS injection", () => {
    const maliciousColor = 'blue; } body { background: red; } .foo { color: red';
    const config = {
      test: { label: "Test", color: maliciousColor },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("body { background: red; }");
  });
});
