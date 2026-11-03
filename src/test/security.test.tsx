import React from "react";
import { render } from "@testing-library/react";
import { describe, test, expect, beforeAll } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  test("sanitizes malicious id, config keys, and color values in ChartStyle", () => {
    const maliciousConfig: ChartConfig = {
      "desktop}; body { background: red; }": {
        label: "Desktop",
        color: "hsl(200 80% 50%); } body { background: red; }",
      },
      "mobile": {
        label: "Mobile",
        color: "url('https://malicious-domain.com/tracker.png')",
      },
    };

    const { container } = render(
      <ChartContainer id={`chart'" <script>alert(1)</script>`} config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();

    const cssText = styleEl?.innerHTML || "";

    // Check id sanitization
    expect(cssText).not.toContain("<script>");
    expect(cssText).not.toContain("'");
    expect(cssText).not.toContain('"');

    // Check key sanitization
    expect(cssText).not.toContain("body { background: red; }");
    expect(cssText).toContain("--color-desktop");

    // Check color sanitization (curly braces, semicolon breakouts stripped)
    expect(cssText).not.toContain("; } body { background: red; }");

    // Check url() SSRF filtering (should return empty string, so no --color-mobile rule created)
    expect(cssText).not.toContain("url('https://malicious-domain.com/tracker.png')");
    expect(cssText).not.toContain("--color-mobile");
  });
});
