import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartStyle } from "../components/ui/chart";

// Mock ResizeObserver safely
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe("Chart Security Sanitization", () => {
  it("should sanitize dynamic ID to prevent CSS injection", () => {
    const maliciousId = "chart-id; body { background: red; }";
    const config = {
      test: { label: "Test", color: "hsl(var(--primary))" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();
    const styleContent = styleTag?.textContent;

    // Check that style content has sanitized the id (removing space, semicolon, braces)
    expect(styleContent).not.toContain("chart-id; body { background: red; }");
    expect(styleContent).toContain("chart-chart-idbodybackgroundred");
  });

  it("should sanitize config keys to prevent CSS property name injection", () => {
    const maliciousKey = "test; } body { background: red; } /*";
    const config = {
      [maliciousKey]: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();
    const styleContent = styleTag?.textContent;

    // Verify key was sanitized and doesn't contain breakout sequences
    expect(styleContent).not.toContain("test; } body { background: red; } /*");
    expect(styleContent).toContain("--color-testbodybackgroundred");
  });

  it("should sanitize color values to block breakout characters and url() constructs", () => {
    const config = {
      test1: { label: "Safe Color", color: "hsl(120, 100%, 50%)" },
      test2: { label: "Malicious Inject", color: "blue; body { background: red; }" },
      test3: { label: "Malicious SSRF", color: "url('http://malicious.com/pixel.png')" },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();
    const styleContent = styleTag?.textContent;

    // test1 (hsl) should be kept safely without parens stripped because sanitizeColor retains modern styling values
    // Wait, sanitizeColor strips '(' and ')' if they are in the regex. Let's make sure our sanitizeColor behaves safely.
    // In our implementation, sanitizeColor returns a sanitized color. Let's check how it works:
    // sanitizeColor blocks url() construct and strips ; { } [ ] " ' < > \
    expect(styleContent).toContain("--color-test1: hsl(120, 100%, 50%)");

    // test2 should have breakout characters stripped
    expect(styleContent).not.toContain("blue; body { background: red; }");
    expect(styleContent).toContain("--color-test2: blue body  background: red ");

    // test3 should return an empty string/not be written due to url() check
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("malicious.com");
  });
});
