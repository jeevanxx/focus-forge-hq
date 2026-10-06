import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("Chart CSS Sanitization Security Tests", () => {
  test("sanitizes malicious container id to prevent selector breakout", () => {
    const maliciousId = 'test"] { color: red; } /*';
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(200, 50%, 50%)" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleText = styleElement?.textContent || "";

    // Should sanitize the id to alphanumeric/dashes/underscores only
    expect(styleText).not.toContain('test"]');
    expect(styleText).toContain("[data-chart=chart-testcolorred]");
  });

  test("sanitizes malicious config keys to prevent CSS variable injection", () => {
    const maliciousKey = "primary; background: url('https://evil.com/leak')";
    const config: ChartConfig = {
      [maliciousKey]: { label: "Evil Key", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleText = container.querySelector("style")?.textContent || "";

    expect(styleText).not.toContain("https://evil.com/leak");
    expect(styleText).not.toContain("; background:");
    expect(styleText).toContain("--color-primarybackgroundurlhttpsevilcomleak: #ff0000");
  });

  test("strips CSS injection characters and url() constructs from color strings", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "red; } body { display: none; } /*" },
      mobile: { label: "Mobile", color: "url('http://attacker.com/pixel.png')" },
      safe: { label: "Safe HSL", color: "hsl(120, 100%, 50%)" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleText = container.querySelector("style")?.textContent || "";

    // Breakout characters and comment markers stripped
    expect(styleText).not.toContain("; } body {");
    expect(styleText).toContain("--color-desktop: red  body  display none  ;");

    // url() constructs blocked completely
    expect(styleText).not.toContain("http://attacker.com/pixel.png");
    expect(styleText).not.toContain("--color-mobile:");

    // Safe HSL color preserved
    expect(styleText).toContain("--color-safe: hsl(120, 100%, 50%)");
  });
});
