import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle } from "@/components/ui/chart";

describe("ChartStyle Security Sanitization", () => {
  it("should sanitize malicious id to prevent breakout of the CSS selector rule", () => {
    const maliciousId = "chart-id-one}; body { background: red; }";
    const config = {
      desktop: {
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.textContent || "";
    // Verify that the breakout sequence "body { background: red; }" was sanitized and is not present as a separate CSS rule.
    expect(styleContent).not.toContain("body { background: red; }");
    // Verify that the data-chart attribute identifier contains only safe characters
    expect(styleContent).toContain("[data-chart=chart-id-onebodybackgroundred]");
  });

  it("should sanitize malicious config keys to prevent injecting arbitrary CSS properties", () => {
    const config = {
      "desktop; background-color: red": {
        color: "blue",
      },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.textContent || "";

    // The semicolon and space should be stripped, making the key name safe
    expect(styleContent).not.toContain("--color-desktop; background-color: red");
    expect(styleContent).toContain("--color-desktopbackground-colorred: blue;");
  });

  it("should sanitize malicious color values to prevent breakout", () => {
    const config = {
      desktop: {
        color: "blue; font-size: 50px; } body { background: red; }",
      },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.textContent || "";

    // Semicolons, braces, and breakout strings should be sanitized out of the color value
    expect(styleContent).not.toContain("blue; font-size: 50px; } body { background: red; }");
    expect(styleContent).toContain("--color-desktop: blue font-size: 50px  body  background: red ;");
  });

  it("should handle modern CSS colors with parentheses and variables correctly while keeping them safe", () => {
    const config = {
      desktop: {
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.textContent || "";

    expect(styleContent).toContain("--color-desktop: hsl(var(--primary));");
  });
});
