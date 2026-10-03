import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "../components/ui/chart";

describe("ChartContainer Security Sanitization", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it("sanitizes malicious id, config keys, and color values", () => {
    const maliciousConfig: ChartConfig = {
      "malicious<key>;": {
        label: "Malicious Key",
        color: "red; } body { display: none }",
      },
      "urlKey": {
        label: "URL Key",
        color: "url('http://attacker.com/leak.png')",
      },
      "safeKey": {
        label: "Safe Key",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id='test"<script>alert(1)</script>' config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    // Verify data-chart attribute on root container is sanitized
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart") || "";
    expect(dataChartAttr).not.toContain("<script>");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).toBe("chart-testscriptalert1script");

    // Verify style tag content does not contain dangerous characters or url() constructs
    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("body { display: none }");
    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("http://attacker.com");
    expect(styleContent).toContain("--color-safeKey: hsl(var(--primary));");
  });
});
