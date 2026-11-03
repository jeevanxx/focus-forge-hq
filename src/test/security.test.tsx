import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { ChartContainer, ChartStyle } from "../components/ui/chart";

describe("Chart Security - CSS Injection Mitigation", () => {
  it("should sanitize dynamic ID to prevent selector breakouts", () => {
    // Malicious ID with breakout characters
    const maliciousId = "chart-id} body { background: red; }";
    const config = {
      test: { label: "Test", color: "blue" },
    };

    render(
      <ChartContainer id={maliciousId} config={config} data-testid="chart-container">
        <div />
      </ChartContainer>
    );

    // The rendered container should have a sanitized data-chart attribute
    const container = screen.getByTestId("chart-container");
    expect(container.getAttribute("data-chart")).toBe("chart-chart-idbodybackgroundred");
  });

  it("should sanitize ID in ChartStyle directly and wrap selector in double quotes", () => {
    const maliciousId = "chart-id} body { background: red; }";
    const config = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();

    const cssContent = styleTag?.innerHTML || "";
    // Check that CSS breakout characters like curly braces are removed from the ID
    expect(cssContent).not.toContain("chart-id}");
    expect(cssContent).not.toContain("body { background: red; }");
    // The clean ID should be: "chart-idbodybackgroundred" or similar, with spaces and braces stripped out
    expect(cssContent).toContain("[data-chart=\"chart-idbodybackgroundred\"]");
  });

  it("should sanitize config keys to prevent invalid CSS properties or breakouts", () => {
    const config = {
      "key-breakout: red; } body { background: red;": { label: "Test", color: "blue" },
    };

    const { container } = render(<ChartStyle id="valid-id" config={config} />);
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();

    const cssContent = styleTag?.innerHTML || "";
    // Should not contain the un-sanitized malicious breakout sequence
    expect(cssContent).not.toContain("key-breakout: red;");
    expect(cssContent).not.toContain("body { background: red;");
    // Keys are sanitized to only contain: [a-zA-Z0-9_-]
    expect(cssContent).toContain("--color-key-breakoutredbodybackgroundred");
  });

  it("should sanitize color values to block breakouts of CSS rules", () => {
    const config = {
      test: { label: "Test", color: "blue; } body { background: red; }" },
    };

    const { container } = render(<ChartStyle id="valid-id" config={config} />);
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();

    const cssContent = styleTag?.innerHTML || "";
    // Should not contain the un-sanitized malicious breakout sequence or curly braces/semicolons
    expect(cssContent).not.toContain("blue;");
    expect(cssContent).not.toContain("body { background: red; }");
    // Let's verify the color is sanitized of breakout characters like ; { } [ ] " ' < > \ : @
    expect(cssContent).toContain("--color-test: blue  body  background red ;");
  });
});
