import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Chart Container Security Sanitization", () => {
  test("sanitizes malicious id to prevent CSS injection and breakout", () => {
    const maliciousId = "chart-id] { background: red; }";
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("]");
    expect(dataChartAttr).not.toContain("{");
    expect(dataChartAttr).not.toContain(" ");

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain("] { background: red; }");
  });

  test("sanitizes malicious config keys to prevent CSS property breakouts", () => {
    const maliciousConfig: ChartConfig = {
      "key; } body { display: none }": { label: "Malicious Key", color: "#00ff00" },
    };

    const { container } = render(
      <ChartContainer id="test" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain("; } body {");
    expect(styleTag?.innerHTML).toContain("--color-keybodydisplaynone: #00ff00");
  });

  test("sanitizes malicious color values containing breakout characters", () => {
    const maliciousColorConfig: ChartConfig = {
      desktop: { label: "Desktop", color: "#123456; } body { color: red }" },
    };

    const { container } = render(
      <ChartContainer id="test" config={maliciousColorConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain("; } body {");
    expect(styleTag?.innerHTML).toContain("--color-desktop: #123456  body  color: red");
  });

  test("blocks CSS url() constructs to prevent SSRF and tracking pixel leaks", () => {
    const urlConfig: ChartConfig = {
      desktop: { label: "Desktop", color: "url('https://tracker.evil.com/pixel.png')" },
    };

    const { container } = render(
      <ChartContainer id="test" config={urlConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML ?? "").not.toContain("tracker.evil.com");
    expect(styleTag?.innerHTML ?? "").not.toContain("url(");
  });

  test("preserves valid CSS color formats", () => {
    const validConfig: ChartConfig = {
      primary: { label: "Primary", color: "hsl(210, 100%, 50%)" },
      secondary: { label: "Secondary", color: "#123456" },
      themed: { label: "Themed", color: "var(--primary-color)" },
    };

    const { container } = render(
      <ChartContainer id="valid" config={validConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).toContain("--color-primary: hsl(210, 100%, 50%)");
    expect(styleTag?.innerHTML).toContain("--color-secondary: #123456");
    expect(styleTag?.innerHTML).toContain("--color-themed: var(--primary-color)");
  });
});
