import { render } from "@testing-library/react";
import { describe, test, expect, beforeAll } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Security - Chart Sanitize", () => {
  test("sanitizes malicious id, config keys, and color breakout values", () => {
    const maliciousConfig: ChartConfig = {
      'bad"urlKey;': {
        label: "URL Key",
        color: 'url("https://malicious.com/leak")',
      },
      'bad"breakoutKey;': {
        label: "Breakout Key",
        color: "red; } body { background: red; }",
      },
      validKey: {
        label: "Valid Key",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id='test"] { background: red; }' config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // Should strip breakout characters from ID
    expect(styleContent).not.toContain('test"]');
    expect(styleContent).toContain("[data-chart=chart-testbackgroundred]");

    // Should strip breakout characters from config keys
    expect(styleContent).not.toContain('bad"urlKey;');
    expect(styleContent).not.toContain('bad"breakoutKey;');
    expect(styleContent).toContain("--color-badbreakoutKey:");

    // Should strip url() constructs to block SSRF / tracking pixel leaks (omitting the entry)
    expect(styleContent).not.toContain("https://malicious.com/leak");
    expect(styleContent).not.toContain("--color-badurlKey:");

    // Should strip semicolons and braces from color values, preventing CSS selector breakout
    expect(styleContent).not.toContain("body {");
    expect(styleContent).toContain("red  body  background: red ");

    // Valid colors should remain intact
    expect(styleContent).toContain("--color-validKey: hsl(var(--primary))");
  });
});
