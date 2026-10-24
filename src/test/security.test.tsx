import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe("ChartContainer Security Sanitization", () => {
  it("sanitizes malicious ID and prevents CSS rule breakout", () => {
    const maliciousConfig: ChartConfig = {
      views: {
        label: "Views",
        color: "hsl(200, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="test-id] { body { display: none; } } /*" config={maliciousConfig}>
        <div />
      </ChartContainer>,
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML ?? "";

    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("[data-chart=chart-test-idbodydisplaynone]");
  });

  it("sanitizes malicious key names in ChartConfig", () => {
    const maliciousConfig: ChartConfig = {
      "key; } body { background: red; }": {
        label: "Malicious Key",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id="chart-key-test" config={maliciousConfig}>
        <div />
      </ChartContainer>,
    );

    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.innerHTML ?? "";

    expect(styleContent).not.toContain("background: red");
    expect(styleContent).toContain("--color-keybodybackgroundred:");
  });

  it("sanitizes dangerous color values (CSS injection and url/tracking pixel vectors)", () => {
    const maliciousConfig: ChartConfig = {
      bar: {
        label: "Bar",
        color: "red; } body { display: none; } --other: ",
      },
      tracker: {
        label: "Tracker",
        color: "url('https://evil.com/pixel.png')",
      },
      valid: {
        label: "Valid",
        color: "hsl(120, 100%, 25%)",
      },
    };

    const { container } = render(
      <ChartContainer id="color-test" config={maliciousConfig}>
        <div />
      </ChartContainer>,
    );

    const styleElement = container.querySelector("style");
    const styleContent = styleElement?.innerHTML ?? "";

    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).not.toContain("https://evil.com/pixel.png");
    expect(styleContent).toContain("--color-bar: red");
    expect(styleContent).toContain("--color-valid: hsl(120, 100%, 25%)");
  });
});
