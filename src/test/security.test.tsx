import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / ResponsiveContainer environment in Vitest
if (typeof global.ResizeObserver === "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

describe("Chart Security - CSS & HTML Injection Prevention", () => {
  it("sanitizes malicious id, config keys, and color values in ChartContainer / ChartStyle", () => {
    const maliciousConfig: ChartConfig = {
      "bad; key</style><script>alert('xss')</script>": {
        label: "XSS Key",
        color: "red; } body { background: red; }; url('http://attacker.com/leak')",
      },
      cleanKey: {
        label: "Clean Key",
        color: "hsl(200, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id={'chart-id"><script>payload()</script>'} config={maliciousConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.textContent || "";

    // Check that script tags or CSS breakout characters are not injected into <style>
    expect(styleContent).not.toContain("<");
    expect(styleContent).not.toContain(">");
    expect(styleContent).not.toContain('"');
    expect(styleContent).not.toContain("url('http://attacker.com/leak')");
    expect(styleContent).not.toContain("body { background: red; }");

    // Check that safe key and clean HSL color are preserved
    expect(styleContent).toContain("--color-cleanKey: hsl(200, 50%, 50%)");
  });
});
