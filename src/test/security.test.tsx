import { render } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { ChartContainer, ChartStyle } from "@/components/ui/chart";

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("Chart CSS & HTML Injection Sanitization", () => {
  it("should sanitize malicious characters in chart IDs", () => {
    const maliciousId = "chart-test;background:url(http://malicious.com);";
    const config = {
      test: {
        label: "Test Label",
        color: "#fff",
      },
    };

    const { container } = render(
      <ChartStyle id={maliciousId} config={config} />,
    );
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // The malicious ID should be stripped of all characters except alphanumeric, dashes, and underscores
    const sanitizedId = "chart-testbackgroundurlhttpmaliciouscom";
    expect(cssContent).toContain(`[data-chart=${sanitizedId}]`);
    expect(cssContent).not.toContain(
      "chart-test;background:url(http://malicious.com);",
    );
  });

  it("should sanitize malicious characters in config keys", () => {
    const id = "test-chart";
    const config = {
      "malicious-key;font-size:100px;": {
        label: "Malicious Key Label",
        color: "#ff0000",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // The key should have semicolons and other characters removed, while hyphens are safely preserved
    expect(cssContent).toContain("--color-malicious-keyfont-size100px");
    expect(cssContent).not.toContain("malicious-key;font-size:100px;");
  });

  it("should sanitize malicious colors with breakout characters", () => {
    const id = "test-chart";
    const config = {
      primary: {
        label: "Normal Color",
        color: "rgb(255, 0, 0)",
      },
      danger: {
        label: "Malicious Color",
        color: "red; background: url('http://malicious.com')",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // Normal color should be allowed
    expect(cssContent).toContain("--color-primary: rgb(255, 0, 0);");
    // Malicious color containing breakout characters should be empty/omitted
    expect(cssContent).not.toContain("--color-danger: red; background:");
    expect(cssContent).not.toContain("url(");
  });

  it("should block and completely strip SSRF / tracking pixel leaks via url() constructs in color values", () => {
    const id = "test-chart";
    const config = {
      leak: {
        label: "SSRF Leak",
        color: "url(https://attacker.example.com/pixel.png)",
      },
      validHsl: {
        label: "Valid HSL",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // SSRF/tracking pixel leak url() construct must be empty/blocked
    expect(cssContent).not.toContain("https://attacker.example.com/pixel.png");
    expect(cssContent).not.toContain("url(");
    // Valid hsl() format should still be allowed
    expect(cssContent).toContain("--color-validHsl: hsl(var(--primary));");
  });

  it("should render ChartContainer safely and apply id sanitization", () => {
    const maliciousId = "malicious<>:id";
    const config = {
      test: {
        label: "Test",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>,
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).not.toBeNull();
    // HTML/SVG breakout characters "<>" and ":" should be stripped out
    expect(outerDiv.getAttribute("data-chart")).toBe("chart-maliciousid");
  });
});
