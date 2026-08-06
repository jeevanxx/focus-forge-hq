import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";
import React from "react";

// Mock ResizeObserver which is used by Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("Chart CSS & HTML Injection Security", () => {
  it("sanitizes dynamic ID to prevent CSS breakout", () => {
    const config = {
      test: { label: "Test", color: "red" },
    };

    const maliciousId = `test-id] { background-color: red; } /*`;
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // The data-chart attribute must be sanitized
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("]");
    expect(dataChartAttr).not.toContain("{");
    expect(dataChartAttr).toBe("chart-test-idbackground-colorred");

    // The style block output must be sanitized and matched with the sanitized ID
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleText = styleElement?.innerHTML;
    expect(styleText).toContain("[data-chart=chart-test-idbackground-colorred]");
    expect(styleText).not.toContain("test-id]");
  });

  it("sanitizes config keys and colors to prevent CSS injection", () => {
    const maliciousConfig = {
      "malicious-key; } body { background: red; } /*": {
        label: "Malicious Key",
        color: 'blue; background: url("http://evil.com");',
      },
    };

    const { container } = render(
      <ChartContainer id="secure-id" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleText = styleElement?.innerHTML;

    // The key should have stripped out the semicolon, space, curly brace, etc.
    expect(styleText).not.toContain("malicious-key;");
    expect(styleText).toContain("--color-malicious-keybodybackgroundred");

    // The color should have stripped out the breakout characters like semicolon, quotes, braces.
    // So 'blue; background: url("http://evil.com");' should become 'blue background: url(http://evil.com)' without quotes, semicolons inside the value.
    expect(styleText).toContain("blue background: url(http://evil.com)");
    expect(styleText).not.toContain('"');
    expect(styleText).not.toContain("'");
  });
});
