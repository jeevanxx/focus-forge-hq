import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import * as React from "react";

// Mock ResizeObserver safely using 'unknown as typeof ResizeObserver' to avoid TypeScript warnings
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("Chart CSS & HTML Injection Security Sanitization", () => {
  it("should sanitize malicious chart IDs to prevent escaping the [data-chart] attribute selector", () => {
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(12, 30%, 40%)",
      },
    };

    const maliciousId = "malicious' -} .injected-rule { background: red; } /*";
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();

    const styleContent = styleTag?.innerHTML || "";
    // The id should be sanitized, removing characters like quotes, curly braces, and spaces.
    expect(styleContent).not.toContain("malicious' -}");
    expect(styleContent).not.toContain(".injected-rule");
    expect(styleContent).toContain("[data-chart=chart-malicious-injected-rulebackgroundred]");
  });

  it("should sanitize malicious configuration keys to prevent injection of arbitrary CSS variables", () => {
    const maliciousConfig: ChartConfig = {
      "desktop; color: red; --injected-var": {
        label: "Desktop",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();

    const styleContent = styleTag?.innerHTML || "";
    // Semicolons and spaces should be stripped from the key to prevent CSS breakout
    expect(styleContent).not.toContain("; color: red;");
    expect(styleContent).toContain("--color-desktopcolorred--injected-var: blue;");
  });

  it("should sanitize malicious color values containing CSS breakout characters", () => {
    const maliciousColorConfig: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "blue; background-color: red; } .hacked { color: green; }",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={maliciousColorConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();

    const styleContent = styleTag?.innerHTML || "";
    // Breakout characters like ';', '}', '{' should be completely removed from the color value to prevent injecting new CSS rules
    expect(styleContent).not.toContain("blue;");
    expect(styleContent).not.toContain("hacked {");
    expect(styleContent).not.toContain("color: green; }");
    expect(styleContent).toContain("blue background-color: red  .hacked  color: green ;");
  });
});
