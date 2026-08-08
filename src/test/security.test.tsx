import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  it("should sanitize malicious characters in id to prevent CSS injection", () => {
    const maliciousId = "chart-breakout] { background: url('bad') } /*";
    const config: ChartConfig = {
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
    expect(styleTag).not.toBeNull();

    const styleContent = styleTag?.innerHTML || "";
    // Malicious characters like ] or { or } should be stripped from the dynamic chartId
    expect(styleContent).not.toContain("chart-breakout]");
    expect(styleContent).not.toContain("background: url('bad')");

    // The sanitized ID should only contain a-zA-Z0-9_-
    expect(styleContent).toContain("chart-chart-breakoutbackgroundurlbad");
  });

  it("should sanitize malicious config keys to prevent CSS injection", () => {
    const config: ChartConfig = {
      "invalid; key { breakout: rule; }": {
        color: "red",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // Unsafe characters in key should be stripped
    expect(styleContent).not.toContain("invalid; key");
    expect(styleContent).not.toContain("{ breakout: rule; }");

    // Key should be sanitized to alphanumeric, dash, or underscore
    expect(styleContent).toContain("--color-invalidkeybreakoutrule");
  });

  it("should sanitize malicious color values to prevent CSS and HTML breakouts", () => {
    const config: ChartConfig = {
      test: {
        color: "blue; } [data-chart] { color: red; } </style><script>alert(1)</script>",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // Breakout characters like ; } < > / should be stripped from color values
    expect(styleContent).not.toContain("blue;");
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");

    // Valid color characters should be kept, breakout characters removed
    expect(styleContent).toContain("blue  data-chart  color: red  /stylescriptalert(1)/script");
  });

  it("should preserve valid modern CSS color declarations (e.g., hsl, rgb, var)", () => {
    const config: ChartConfig = {
      test: {
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // h, s, l, (, ), -, _ should be allowed
    expect(styleContent).toContain("hsl(var(--primary))");
  });
});
