import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious container id prop", () => {
    const maliciousId = "chart'\"</div><script>alert(1)</script>";
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#ff0000" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert(1)");
    expect(styleContent).not.toContain("</div>");
    expect(styleContent).not.toContain("'");
    expect(styleContent).not.toContain('"');
  });

  test("sanitizes malicious config keys", () => {
    const config: ChartConfig = {
      "bad;key}body{color:red;": { label: "Bad Key", color: "#00ff00" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("bad;key}");
    expect(styleContent).not.toContain("body{color:red;");
  });

  test("blocks color values with CSS breakout characters", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "red; } </style><script>alert('xss')</script>" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("script");
    expect(styleContent).not.toContain("alert");
    expect(styleContent).not.toContain("--color-desktop:");
  });

  test("blocks url() SSRF/tracking pixel constructs in color values", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "url('https://evil.com/tracker.png')" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("evil.com");
    expect(styleContent).not.toContain("--color-desktop:");
  });

  test("allows valid modern CSS color values", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(var(--primary))" },
      mobile: { label: "Mobile", color: "#123456" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.innerHTML || "";

    expect(styleContent).toContain("--color-desktop: hsl(var(--primary));");
    expect(styleContent).toContain("--color-mobile: #123456;");
  });
});
