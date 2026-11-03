import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartStyle, type ChartConfig } from "../components/ui/chart";

describe("ChartStyle Security Sanitization", () => {
  it("should sanitize malicious chart ID to prevent CSS injection", () => {
    const maliciousId = "chart-id] } body { background: red; } /*";
    const config: ChartConfig = {
      test: { color: "blue" },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";
    // The malicious ID should be sanitized: only alphanumeric, dash, and underscore are allowed.
    expect(styleContent).not.toContain("chart-id] }");
    expect(styleContent).not.toContain("body { background: red; }");
    // Ensure the selector is quoted and uses the safe ID
    expect(styleContent).toContain('[data-chart="chart-idbodybackgroundred"]');
  });

  it("should sanitize malicious config keys to prevent CSS property injection", () => {
    const config: ChartConfig = {
      "malicious-key; } body { background: red; } /*": { color: "blue" },
    };

    const { container } = render(<ChartStyle id="test-id" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";
    expect(styleContent).not.toContain("malicious-key; }");
    expect(styleContent).not.toContain("body { background: red; }");
    // Keys are sanitized to alphanumeric, dashes, and underscores
    expect(styleContent).toContain("--color-malicious-keybodybackgroundred: blue;");
  });

  it("should sanitize malicious color values to prevent CSS rule breakout", () => {
    const config: ChartConfig = {
      test: { color: "blue; } body { background: red; } /*" },
    };

    const { container } = render(<ChartStyle id="test-id" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";
    expect(styleContent).not.toContain("blue; }");
    expect(styleContent).not.toContain("body { background: red; }");
    // Breakout characters like ;, }, {, etc. are stripped
    expect(styleContent).toContain("blue  body  background red  /*");
  });

  it("should allow safe color formats like hex, rgb, and hsl with spaces", () => {
    const config: ChartConfig = {
      hex: { color: "#ff0000" },
      rgb: { color: "rgb(255, 0, 0)" },
      hsl: { color: "hsl(0, 100%, 50%)" },
      theme: {
        theme: {
          light: "var(--light-color)",
          dark: "var(--dark-color)",
        },
      },
    };

    const { container } = render(<ChartStyle id="test-id" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";
    expect(styleContent).toContain("--color-hex: #ff0000;");
    expect(styleContent).toContain("--color-rgb: rgb(255, 0, 0);");
    expect(styleContent).toContain("--color-hsl: hsl(0, 100%, 50%);");
  });
});
