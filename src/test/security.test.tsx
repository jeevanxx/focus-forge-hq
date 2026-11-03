import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id, config keys, and color values in ChartStyle", () => {
    const maliciousConfig: ChartConfig = {
      "desktop}; body { background: red; }": {
        label: "Desktop",
        color: "hsl(220, 90%, 56%); } body { display: none; } --hack: url('http://attacker.com/leak')",
      },
      "mobile": {
        label: "Mobile",
        color: "url('https://malicious.com/tracking.png')",
      },
      "valid": {
        label: "Valid",
        color: "hsl(220, 90%, 56%)",
      },
    };

    const { container } = render(
      <ChartContainer
        id='test-chart"}] { background: red; }'
        config={maliciousConfig}
      >
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // Check that CSS breakout characters like }, {, ;, ", ' are stripped or prevented from breaking CSS rules
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("body { display: none; }");

    // Check that url() constructs are completely blocked for CSS injection / SSRF / tracking pixel leaks
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("http://attacker.com");
    expect(styleContent).not.toContain("https://malicious.com");

    // Verify sanitized outputs remain functional
    expect(styleContent).toContain("[data-chart=chart-test-chartbackgroundred]");
    expect(styleContent).toContain("--color-valid: hsl(220, 90%, 56%)");
  });
});
