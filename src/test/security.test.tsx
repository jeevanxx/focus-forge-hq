import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in test environment
beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("ChartContainer Security Sanitization", () => {
  it("sanitizes malicious chart id prop to prevent CSS injection", () => {
    const maliciousId = 'test"] { body { display: none; } } /*';
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

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    // Expect malicious breakout characters to be stripped
    expect(styleContent).not.toContain('test"]');
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("[data-chart=chart-testbodydisplaynone]");
  });

  it("sanitizes malicious config keys to prevent CSS property/rule injection", () => {
    const maliciousKey = "desktop; } body { display: none; }";
    const config: ChartConfig = {
      [maliciousKey]: {
        label: "Malicious Key",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("--color-desktop;");
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("--color-desktopbodydisplaynone:");
  });

  it("sanitizes malicious color values and blocks url() SSRF/pixel tracking leaks", () => {
    const configWithMaliciousColors: ChartConfig = {
      breakout: {
        label: "Breakout Color",
        color: 'red; } </style><script>alert("xss")</script>',
      },
      ssrf: {
        label: "SSRF Leak",
        color: "url('https://attacker.com/leak.png')",
      },
      validHsl: {
        label: "Valid HSL",
        color: "hsl(var(--chart-1))",
      },
    };

    const { container } = render(
      <ChartContainer config={configWithMaliciousColors}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.innerHTML || "";

    // Breakout characters stripped
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain('alert("xss")');

    // url() construct rejected entirely
    expect(styleContent).not.toContain("attacker.com");
    expect(styleContent).not.toContain("url(");

    // Valid HSL preserved
    expect(styleContent).toContain("--color-validHsl: hsl(var(--chart-1));");
  });
});
