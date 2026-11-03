import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartContainer } from "./chart";
import React from "react";

describe("ChartContainer Security", () => {
  it("sanitizes id to prevent CSS injection", () => {
    const maliciousId = "my-id] { background: red; } /*";
    const config = {
      test: {
        color: "blue",
      },
    };
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();
    const cssContent = styleTag?.innerHTML || "";

    // If not sanitized, it will contain the raw malicious string
    // which might break out of the [data-chart=...] selector.
    expect(cssContent).not.toContain("background: red;");
    // Should be sanitized and include the "chart-" prefix from ChartContainer
    expect(cssContent).toContain('[data-chart="chart-my-idbackgroundred"]');
  });

  it("sanitizes config keys to prevent CSS injection", () => {
    const maliciousKey = "key: color; } body { background: red; } .fake { --dummy";
    const config = {
      [maliciousKey]: {
        color: "blue",
      },
    };
    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const cssContent = styleTag?.innerHTML || "";

    expect(cssContent).not.toContain("body { background: red; }");
  });

  it("sanitizes color values to prevent CSS injection", () => {
    const maliciousColor = "red; } body { background: red; }";
    const config = {
      test: {
        color: maliciousColor,
      },
    };
    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const cssContent = styleTag?.innerHTML || "";

    expect(cssContent).not.toContain("body { background: red; }");
  });
});
