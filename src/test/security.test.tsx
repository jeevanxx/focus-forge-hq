import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver safely
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: MockResizeObserver as unknown as typeof ResizeObserver,
  });
});

describe("ChartContainer Security & Sanitization", () => {
  it("should sanitize malicious id containing characters that try to break out of CSS or HTML tags", () => {
    const maliciousId = `malicious-id] { background-color: red; } </style><script>alert('XSS')</script><style>`;
    const config: ChartConfig = {
      views: {
        label: "Views",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // The rendered style tag or wrapper should not have the raw malicious selector/tags in it
    const htmlString = container.innerHTML;

    // We expect the style elements to be safe and free of malicious tags
    expect(htmlString).not.toContain("<script>alert('XSS')</script>");
    expect(htmlString).not.toContain("body { background: red; }");

    // Find the actual style tag inside container and check its text content
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    if (styleTag) {
      const cssText = styleTag.textContent || "";
      expect(cssText).not.toContain("malicious-id]");
      expect(cssText).not.toContain("</style>");
      expect(cssText).not.toContain("<script>");
      // The id should be fully sanitized, merging safe characters together
      expect(cssText).toContain("malicious-idbackground-colorredstylescriptalertXSSscriptstyle");
    }
  });

  it("should sanitize config key names containing breakout characters", () => {
    const maliciousKey = `malicious-key; } body { background: red; } /*`;
    const config: ChartConfig = {
      [maliciousKey]: {
        label: "Malicious Key",
        color: "red",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    if (styleTag) {
      const cssText = styleTag.textContent || "";
      expect(cssText).not.toContain("malicious-key; }");
      expect(cssText).not.toContain("body { background: red; }");
      // The key should have been sanitized to: malicious-key
      expect(cssText).toContain("--color-malicious-key");
    }
  });

  it("should sanitize config color values containing CSS or HTML breakouts", () => {
    const maliciousColor = `blue; } body { background: red; } /* </style><script>alert(1)</script><style>`;
    const config: ChartConfig = {
      views: {
        label: "Views",
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
    if (styleTag) {
      const cssText = styleTag.textContent || "";
      expect(cssText).not.toContain("blue; }");
      expect(cssText).not.toContain("body { background: red; }");
      expect(cssText).not.toContain("<script>");
      expect(cssText).not.toContain("</style>");
    }
  });

  it("should block and strip color values containing CSS url() to prevent external requests/tracking pixel leaks", () => {
    const maliciousColor = `url(http://malicious-tracker.com/pixel.png)`;
    const config: ChartConfig = {
      views: {
        label: "Views",
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
    if (styleTag) {
      const cssText = styleTag.textContent || "";
      expect(cssText).not.toContain("url(");
      expect(cssText).not.toContain("malicious-tracker");
    }
  });

  it("should preserve safe CSS color syntaxes (like hsl, var, rgb, hex)", () => {
    const config: ChartConfig = {
      test1: {
        label: "Test Hex",
        color: "#3b82f6",
      },
      test2: {
        label: "Test Hsl",
        color: "hsl(var(--primary))",
      },
      test3: {
        label: "Test Var",
        color: "var(--color-test)",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    if (styleTag) {
      const cssText = styleTag.textContent || "";
      expect(cssText).toContain("--color-test1: #3b82f6");
      expect(cssText).toContain("--color-test2: hsl(var(--primary))");
      expect(cssText).toContain("--color-test3: var(--color-test)");
    }
  });
});
