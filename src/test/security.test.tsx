import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in test environment
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  it("sanitizes malicious characters from chart id and config keys", () => {
    const maliciousId = 'test-chart"><script>alert(1)</script>';
    const config: ChartConfig = {
      'desktop"; } body { display: none !important; }': {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Verify malicious breakout characters in ID and keys are sanitized
    expect(styleContent).not.toContain('<script>');
    expect(styleContent).not.toContain('body { display: none !important; }');
    expect(styleContent).toContain('[data-chart=chart-test-chartscriptalert1script]');
    expect(styleContent).toContain('--color-desktopbodydisplaynoneimportant');
  });

  it("strips CSS breakouts and blocks url() constructs in color values", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: 'red; } body { background: red; }; url("http://evil.com/leak")',
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Verify url() and breakout curly braces / semicolons were stripped / blocked
    expect(styleContent).not.toContain("evil.com");
    expect(styleContent).not.toContain("background: red");
    expect(styleContent).not.toContain("url(");
  });
});
