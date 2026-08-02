import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer } from "../components/ui/chart";

describe("Chart Security and Sanitization", () => {
  it("sanitizes malicious chart ID to prevent CSS injection", () => {
    const maliciousId = "chart-id; breakout { background: red; }";
    const config = {
      test: {
        label: "Test",
        color: "red",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Ensure the container element has a sanitized data-chart attribute
    const divWithChartId = container.querySelector("[data-chart]");
    expect(divWithChartId).toBeTruthy();

    const chartAttribute = divWithChartId?.getAttribute("data-chart");
    // Should remove spaces, semicolons, curly braces, and only keep alphanumeric, dashes, and underscores
    expect(chartAttribute).not.toContain(" ");
    expect(chartAttribute).not.toContain(";");
    expect(chartAttribute).not.toContain("{");
    expect(chartAttribute).toBe("chart-chart-idbreakoutbackgroundred");
  });

  it("sanitizes malicious configuration keys used as CSS custom property names", () => {
    // Malicious key attempting to break out of the selector block and inject arbitrary CSS rules
    const maliciousKey = "test-prop; } body { background: red; } /*";
    const config = {
      [maliciousKey]: {
        label: "Malicious Key",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id="secure-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();
    const styleContent = styleElement?.textContent || "";

    // The key should be sanitized to only [a-zA-Z0-9_-], removing spaces, semicolons, curly braces, etc.
    expect(styleContent).not.toContain("; } body { background: red; } /*");
    expect(styleContent).not.toContain("test-prop;");
    expect(styleContent).toContain("--color-test-propbodybackgroundred");
  });

  it("sanitizes malicious color values used as CSS variables", () => {
    // Malicious color value trying to close the custom property definition and inject CSS rules or HTML tags
    const maliciousColor = "blue; } body { background: red; } </style><script>alert('xss')</script>";
    const config = {
      test: {
        label: "Test",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id="secure-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();
    const styleContent = styleElement?.textContent || "";

    // Semicolons, curly braces, HTML tags, and other breakout characters should be removed or neutralized
    expect(styleContent).not.toContain("blue;");
    expect(styleContent).not.toContain("blue; }");
    expect(styleContent).not.toContain("body {");
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert('xss')");
    // Should be safely neutralized
    expect(styleContent).toContain("blue  body  background: red  /stylescriptalert(xss)/script");
  });

  it("retains valid characters in CSS color values like modern hsl, rgb, and var functions", () => {
    // Valid modern CSS colors using parameters, parentheses, percentages, commas, and dots
    const validColors = [
      "hsl(var(--primary))",
      "rgba(255, 0, 0, 0.5)",
      "var(--color-custom-123)",
    ];

    validColors.forEach((color, idx) => {
      const config = {
        [`test-${idx}`]: {
          label: "Test Color",
          color,
        },
      };

      const { container } = render(
        <ChartContainer id={`secure-id-${idx}`} config={config}>
          <div />
        </ChartContainer>
      );

      const styleElement = container.querySelector("style");
      const styleContent = styleElement?.textContent || "";

      // Valid parameters and parentheses should be fully preserved
      expect(styleContent).toContain(color);
    });
  });
});
