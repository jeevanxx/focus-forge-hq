import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / ResponsiveContainer compatibility
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe("Chart Security Sanitization", () => {
  it("sanitizes malicious id, config keys, and color values to prevent CSS injection and SSRF", () => {
    const maliciousConfig: ChartConfig = {
      "bad; key { background: red }": {
        label: "Test Label",
        color: "hsl(var(--primary)); } body { display: none } url(https://malicious.site/pixel.png)",
      },
      normalKey: {
        label: "Normal Label",
        color: "hsl(120, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="test</html><script>alert(1)</script>" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // HTML/CSS injection characters should be stripped from ID
    expect(styleContent).not.toContain("</html>");
    expect(styleContent).not.toContain("<script>");

    // Malicious config key breakout characters should be sanitized
    expect(styleContent).not.toContain("bad;");
    expect(styleContent).not.toContain("key {");

    // Malicious color breakout characters and url() construct should be stripped/blocked
    expect(styleContent).not.toContain("body { display: none }");
    expect(styleContent).not.toContain("url(https://malicious.site/pixel.png)");

    // Valid color should still be rendered correctly
    expect(styleContent).toContain("--color-normalKey: hsl(120, 50%, 50%);");
  });
});
