import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle, ChartConfig } from "../components/ui/chart";
import React from "react";

describe("ChartStyle Security", () => {
  it("sanitizes malicious id to prevent attribute breakout", () => {
    const maliciousId = '"><script>alert(1)</script>';
    const config: ChartConfig = {
      test: { color: "red" },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const content = styleElement?.innerHTML;

    // The malicious ID should be sanitized (special chars removed)
    // The expected sanitized ID is just "scriptalert1script" or similar depending on the regex
    // [data-chart="..."] should be present and quoted
    expect(content).toContain('[data-chart="');
    expect(content).not.toContain(maliciousId);
  });

  it("sanitizes malicious config keys to prevent CSS breakout", () => {
    const maliciousKey = "test; } body { background: red; } .foo";
    const config: ChartConfig = {
      [maliciousKey]: { color: "blue" },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const content = styleElement?.innerHTML;

    expect(content).not.toContain(maliciousKey);
    // It should contain the sanitized version (testbodybackgroundredfoo)
    expect(content).toContain("--color-testbodybackgroundredfoo");
  });

  it("sanitizes malicious color values", () => {
    const maliciousColor = "blue; } body { background: red; }";
    const config: ChartConfig = {
      test: { color: maliciousColor },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const content = styleElement?.innerHTML;

    expect(content).not.toContain(maliciousColor);
    expect(content).toContain("--color-test: transparent;");
  });

  it("allows valid modern CSS colors with spaces", () => {
    const validColor = "oklch(0.7 0.2 150)";
    const config: ChartConfig = {
      test: { color: validColor },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    const content = styleElement?.innerHTML;

    expect(content).toContain(`--color-test: ${validColor};`);
  });
});
