import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / ResponsiveContainer in testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Chart Container CSS Sanitization", () => {
  it("sanitizes malicious chart ID, config keys, and color values", () => {
    const maliciousId = `test-id"}<script>alert(1)</script>`;
    const config: ChartConfig = {
      'safeKey': {
        label: "Safe Key",
        color: "hsl(200, 50%, 50%)",
      },
      'badKey"; breakout{}': {
        label: "Bad Key",
        color: 'red; } body { display: none; } /*',
      },
      'trackingUrl': {
        label: "Tracking Url",
        color: 'url("https://attacker.com/leak")',
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Test Chart Child</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Verify malicious ID is sanitized (quotes, brackets, script tags removed)
    expect(styleContent).not.includes("<script>");
    expect(styleContent).not.includes('alert(1)');
    expect(styleContent).not.includes('"');
    expect(styleContent).includes("data-chart=chart-test-idscriptalert1script");

    // Verify bad key and CSS breakout attempt in color are sanitized
    expect(styleContent).not.includes('body { display: none; }');
    expect(styleContent).not.includes('/*');
    expect(styleContent).includes("--color-badKeybreakout");
    expect(styleContent).includes("red");

    // Verify url(...) constructs are completely blocked
    expect(styleContent).not.includes("attacker.com");
    expect(styleContent).not.includes("url");
  });
});
