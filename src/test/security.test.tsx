import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartContainer } from "@/components/ui/chart";

// Mock ResizeObserver for recharts compatibility in tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

describe("ChartStyle security and sanitization", () => {
  it("should sanitize malicious container id to prevent tag/attribute breakout", () => {
    const config = {
      test: {
        label: "Test",
        color: "blue",
      },
    };

    // Render container with a malicious ID
    const { container } = render(
      <ChartContainer id="malicious<script>alert(1)</script>" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const cssText = styleElement?.innerHTML || "";
    // Verify script tags are stripped or sanitized
    expect(cssText).not.toContain("<script>");
    expect(cssText).not.toContain("</script>");
    expect(cssText).toContain("maliciousscriptalert1script");
  });

  it("should sanitize malicious config keys to prevent CSS breakout", () => {
    const maliciousConfig = {
      "malicious;body{background:red}": {
        label: "Malicious Key",
        color: "green",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    // Verify key breakout elements are sanitized
    expect(cssText).not.toContain("malicious;body{background:red}");
    expect(cssText).toContain("--color-maliciousbodybackgroundred");
  });

  it("should sanitize malicious color values to prevent CSS breakout and injection", () => {
    const config = {
      test: {
        label: "Test",
        color: "red; } body { background: url('malicious.jpg'); }",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    // Verify that the breakout characters (like curly braces and quotes) are completely removed
    expect(cssText).not.toContain("'");
    expect(cssText).toContain("red  body  background: url(malicious.jpg) ");

    // There should only be standard template braces (2 opening, 2 closing for light and dark themes)
    const openBracesCount = (cssText.match(/{/g) || []).length;
    const closeBracesCount = (cssText.match(/}/g) || []).length;
    expect(openBracesCount).toBe(2);
    expect(closeBracesCount).toBe(2);

    // Semicolons should only appear as the standard property delimiters (2 total, one for light, one for dark)
    const semicolonsCount = (cssText.match(/;/g) || []).length;
    expect(semicolonsCount).toBe(2);
  });

  it("should preserve legitimate modern color syntaxes", () => {
    const config = {
      test: {
        label: "Test",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    // Legit colors like variables or hsl syntax with parentheses should be fully preserved
    expect(cssText).toContain("hsl(var(--primary))");
  });
});
