import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartStyle } from "../components/ui/chart";
import React from "react";

describe("Chart CSS Sanitization and Security Suite", () => {
  it("sanitizes dynamic id prop to prevent breakout/injection", () => {
    const maliciousId = "id-breakout; { background-color: red; }";
    const config = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Test Chart</div>
      </ChartContainer>
    );

    // The component should sanitize the malicious id to prevent css inject/breakout.
    // Specifying "id-breakout; { background-color: red; }" should have characters like spaces, semicolons, brackets stripped or sanitized.
    const containerDiv = container.querySelector("[data-chart]");
    expect(containerDiv).toBeTruthy();

    const dataChartAttr = containerDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain(";");
    expect(dataChartAttr).not.toContain("{");
    expect(dataChartAttr).not.toContain("}");
    expect(dataChartAttr).toBe("chart-id-breakoutbackground-colorred");
  });

  it("sanitizes dynamic config keys and color values in ChartStyle", () => {
    const maliciousConfig = {
      "key-inject; color: red;": {
        label: "Malicious Key",
        color: "blue; background-color: red;",
      },
    };

    const { container } = render(
      <ChartStyle id="test-chart" config={maliciousConfig} />
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).toBeTruthy();
    const styleHtml = styleEl?.innerHTML;

    // Verify key sanitization
    expect(styleHtml).not.toContain("key-inject; color: red;");
    // Verify color value sanitization
    expect(styleHtml).not.toContain("blue; background-color: red;");
    // Semicolons and colons shouldn't survive in dynamic values or keys
    expect(styleHtml).toContain("--color-key-injectcolorred");
  });
});
