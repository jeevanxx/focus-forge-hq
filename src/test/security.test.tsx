import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in test environment
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  test("sanitizes malicious chart ID against HTML and CSS injection", () => {
    const maliciousId = 'test"</style><script>alert(1)</script>';
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Ensure injection characters are stripped
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain('"');
    expect(styleContent).toContain("[data-chart=chart-teststylescriptalert1script]");
  });

  test("sanitizes malicious config keys against CSS variable injection", () => {
    const maliciousConfig: ChartConfig = {
      "desktop; body { display: none; }": {
        label: "Desktop",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.innerHTML || "";

    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("--color-desktopbodydisplaynone");
  });

  test("sanitizes malicious color values against CSS breakout and url() SSRF/tracking pixel leaks", () => {
    const maliciousConfig: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "#2563eb; } body { background: red; }",
      },
      mobile: {
        label: "Mobile",
        color: "url(https://attacker.com/leak.png)",
      },
      validHsl: {
        label: "Valid HSL",
        color: "hsl(215 25% 27%)",
      },
    };

    const { container } = render(
      <ChartContainer id="color-chart" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.innerHTML || "";

    // Breakout chars ; and } should be stripped
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).toContain("--color-desktop: #2563eb  body  background red");

    // url() construct should be stripped entirely to prevent SSRF/tracking pixel leaks
    expect(styleContent).not.toContain("attacker.com");
    expect(styleContent).not.toContain("--color-mobile:");

    // Normal color strings like HSL should remain valid
    expect(styleContent).toContain("--color-validHsl: hsl(215 25% 27%)");
  });
});
