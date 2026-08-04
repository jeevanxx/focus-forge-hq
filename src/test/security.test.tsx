import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer } from "../components/ui/chart";

// Mock ResizeObserver for Recharts
beforeAll(() => {
  class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.ResizeObserver = ResizeObserver;
});

describe("Chart CSS & Injection Sanitization", () => {
  it("sanitizes potentially malicious id, config keys, and colors to prevent CSS injection", () => {
    const maliciousId = "id-breakout; } * { background: url('http://evil.com'); }";
    const maliciousKey = "key-breakout; } * { color: red; }";
    const maliciousColor = "red; } * { font-size: 100px; }";

    const config = {
      [maliciousKey]: {
        label: "Malicious Key Label",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Get the generated style tag
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // The malicious elements should be sanitized
    // Alphanumeric + dash/underscore only for ID and keys
    expect(styleContent).not.toContain(maliciousId);
    expect(styleContent).not.toContain(maliciousKey);
    expect(styleContent).not.toContain(maliciousColor);

    // Verify sanitization behavior:
    // "id-breakout; } * { background: url('http://evil.com'); }" -> "id-breakoutbackgroundurlhttpevilcom"
    // "key-breakout; } * { color: red; }" -> "key-breakoutcolorred"
    // "red; } * { font-size: 100px; }" -> "red * font-size: 100px" (semi-colons and brackets stripped)
    expect(styleContent).toContain("chart-id-breakoutbackgroundurlhttpevilcom");
    expect(styleContent).toContain("--color-key-breakoutcolorred");
    expect(styleContent).toContain("red  *  font-size: 100px");
  });
});
