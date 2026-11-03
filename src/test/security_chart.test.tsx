import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "../components/ui/chart";
import React from "react";

// Mock ResizeObserver which is used by Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ChartContainer Security", () => {
  it("should sanitize the id to prevent CSS injection", () => {
    const maliciousId = '"><style>body{background:red;}</style>';
    const config = {
      primary: {
        label: "Primary",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Check if the id attribute is broken or contains the malicious string
    const chartDiv = container.querySelector("[data-chart]");
    const chartId = chartDiv?.getAttribute("data-chart");

    // It should not contain the breakout characters unescaped/unsanitized
    expect(chartId).not.toContain('">');

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain('body{background:red;}');
  });

  it("should sanitize config keys to prevent CSS injection", () => {
    const maliciousKey = 'primary: red; } body { background: red; } .foo { color';
    const config = {
      [maliciousKey]: {
        label: "Malicious",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    // It should not contain the breakout
    expect(styleTag?.innerHTML).not.toContain('body { background: red; }');
  });

  it("should sanitize color values to prevent CSS injection", () => {
    const maliciousColor = 'blue; } body { background: red; } .foo { color: red';
    const config = {
      primary: {
        label: "Primary",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain('body { background: red; }');
  });
});
