import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts responsive container inside vitest environment
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("Chart Security and Sanitization", () => {
  it("sanitizes malicious chart ID to prevent style/DOM breakouts", () => {
    const maliciousId = `malicious-id; { background: red; } </style><script>alert(1)</script>`;
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // The data-chart attribute on the container should be sanitized (only alphanumeric and - and _)
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const sanitizedId = chartDiv?.getAttribute("data-chart");

    expect(sanitizedId).not.toContain(";");
    expect(sanitizedId).not.toContain("{");
    expect(sanitizedId).not.toContain("}");
    expect(sanitizedId).not.toContain("</style>");
    expect(sanitizedId).not.toContain("<script>");
  });

  it("sanitizes malicious config keys to prevent CSS rule breakout", () => {
    const maliciousKey = `desktop; } body { background-color: red !important; `;
    const config: ChartConfig = {
      [maliciousKey]: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML;

    // The key should have spaces, semicolons, and curly braces removed
    expect(styleContent).not.toContain("body { background-color: red !important; }");
    // Standard sanitized key
    expect(styleContent).toContain("--color-desktop");
  });

  it("sanitizes malicious config color values to block critical breakout characters while allowing valid ones", () => {
    const maliciousColor = `hsl(var(--primary)); } body { content: "attack"; } /*`;
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML;

    // Critical breakout characters like ; { } and double quotes/backslash should be blocked
    expect(styleContent).not.toContain("body { content:");
    expect(styleContent).not.toContain("; } body");
    // Valid parts like hsl and variable should be preserved where possible, but safely sanitized
    expect(styleContent).toContain("--color-desktop:");
  });
});
