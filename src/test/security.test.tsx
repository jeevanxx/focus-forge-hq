import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "../components/ui/chart";

beforeAll(() => {
  // Localized mock of ResizeObserver to support robust Recharts component layout rendering
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("ChartContainer security and sanitization", () => {
  it("should sanitize malicious characters in id to prevent injection", () => {
    const maliciousId = "chart-id; } body { background: red; }";
    const config = {
      desktop: {
        label: "Desktop",
        color: "red",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const cssContent = styleTag?.innerHTML || "";

    // The malicious ID should be sanitized to remove spaces, semicolons, braces
    expect(cssContent).not.toContain("chart-id; } body { background: red; }");
    // It should contain the sanitized ID
    expect(cssContent).toContain("[data-chart=chart-chart-idbodybackgroundred]");
  });

  it("should sanitize malicious custom config keys", () => {
    const config = {
      "desktop; } body { background: red; }": {
        label: "Desktop",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const cssContent = styleTag?.innerHTML || "";

    // The key should be sanitized and not contain raw breakout code
    expect(cssContent).not.toContain("desktop; }");
    expect(cssContent).toContain("--color-desktopbodybackgroundred");
  });

  it("should sanitize malicious color values", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: "blue; background: url(malicious-site);",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const cssContent = styleTag?.innerHTML || "";

    // The color should be sanitized and not contain breakout characters like semicolons
    expect(cssContent).not.toContain("blue;");
    expect(cssContent).toContain("--color-desktop: blue background: url(malicious-site)");
  });

  it("should preserve valid theme/color variables like CSS variables and hsl", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const cssContent = styleTag?.innerHTML || "";

    // Hsl and CSS variable syntax should be preserved since they don't break out
    expect(cssContent).toContain("--color-desktop: hsl(var(--primary))");
  });
});
