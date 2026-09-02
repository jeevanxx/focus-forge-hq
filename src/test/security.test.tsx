import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id, keys, and color values in style tag", () => {
    const maliciousConfig: ChartConfig = {
      'desktop"; } body { background: red; }': {
        label: "Desktop",
        color: 'red; } body { display: none; } url("http://evil.com")',
      },
      'mobile_breakout': {
        label: "Mobile",
        color: 'blue; } body { color: green; }',
      },
    };

    const { container } = render(
      <ChartContainer id='test"<script>alert(1)</script>' config={maliciousConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML || "";

    // Ensure breakout characters, script tags, and raw urls are stripped/neutralized
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert(1)");
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("display: none;");
    expect(styleContent).not.toContain("body { color: green; }");
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("http://evil.com");

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    expect(chartDiv?.getAttribute("data-chart")).not.toContain("<script>");
  });
});
