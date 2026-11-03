import { render } from "@testing-library/react";
import { describe, test, expect, beforeAll } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom environment
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Chart Security Sanitization Tests", () => {
  test("sanitizes malicious chart id to prevent CSS attribute selector injection", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "#2563eb",
      },
    };

    const maliciousId = `malicious"] { background: red; } /*`;
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleText = styleElement?.innerHTML || "";

    expect(styleText).not.toContain('malicious"]');
    expect(styleText).not.toContain("background: red");
    expect(styleText).toContain("[data-chart=chart-maliciousbackgroundred]");
  });

  test("sanitizes config keys and color breakout attempts in generated CSS variables", () => {
    const config: ChartConfig = {
      'bad_key"; } body { display: none; }': {
        label: "Malicious Key",
        color: 'red; } body { background: black; }',
      },
      validKey: {
        label: "Valid Key",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const styleText = styleElement?.innerHTML || "";

    // Breakout strings must not exist in the style block
    expect(styleText).not.toContain("body { display: none; }");
    expect(styleText).not.toContain("body { background: black; }");

    // Cleaned key and sanitized color should be preserved without breaking out of CSS declaration
    expect(styleText).toContain("--color-bad_keybodydisplaynone: red  body  background: black ;");
    expect(styleText).toContain("--color-validKey: hsl(var(--primary));");
  });

  test("blocks url() constructs in color to prevent SSRF and tracking pixel leaks", () => {
    const config: ChartConfig = {
      leakKey: {
        label: "Leak Test",
        color: 'url("https://attacker.com/leak.png")',
      },
    };

    const { container } = render(
      <ChartContainer id="leak-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const styleText = styleElement?.innerHTML || "";

    expect(styleText).not.toContain("https://attacker.com/leak.png");
    expect(styleText).not.toContain("--color-leakKey");
  });
});
