import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartStyle, type ChartConfig } from "../components/ui/chart";

describe("ChartStyle Security Sanitization", () => {
  it("should sanitize malicious characters in id to prevent CSS/HTML breakout", () => {
    const maliciousId = "chart-id} [data-chart=id] { background-color: red; }";
    const config: ChartConfig = {
      primary: { color: "red" },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // The malicious breakout should be stripped, and only alphanumeric/dashes/underscores preserved
    expect(cssContent).not.toContain("chart-id}");
    expect(cssContent).not.toContain("background-color: red;");
    expect(cssContent).toContain("chart-iddata-chartidbackground-colorred");
  });

  it("should sanitize malicious configuration keys inside CSS custom property name", () => {
    const id = "test-chart";
    const config: ChartConfig = {
      "primary; background: red;": { color: "blue" },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // The key "primary; background: red;" should be sanitized, removing semicolon/spaces
    expect(cssContent).not.toContain("primary;");
    expect(cssContent).not.toContain("background: red;");
    expect(cssContent).toContain("--color-primarybackgroundred");
  });

  it("should block critical breakout characters in color values", () => {
    const id = "test-chart";
    const config: ChartConfig = {
      primary: { color: "red; background: url('javascript:alert(1)');" },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // Semicolon, single quote, double quote, etc. must be stripped
    expect(cssContent).not.toContain("red;");
    expect(cssContent).not.toContain("'javascript:alert(1)'");
    expect(cssContent).toContain("red background: url(javascript:alert(1))");
  });

  it("should preserve safe modern color function syntaxes like hsl() and var()", () => {
    const id = "test-chart";
    const config: ChartConfig = {
      primary: { color: "hsl(var(--color-primary))" },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const cssContent = styleElement?.textContent || "";

    // Normal color functions should be preserved completely
    expect(cssContent).toContain("--color-primary: hsl(var(--color-primary));");
  });
});
