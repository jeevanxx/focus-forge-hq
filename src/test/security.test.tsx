import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious chart ID against XSS and CSS injection", () => {
    const config: ChartConfig = {
      sessions: {
        label: "Sessions",
        color: "hsl(120, 50%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id='test"><script>alert(1)</script>' config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("</script>");
    expect(styleContent).not.toContain('"');
    expect(styleContent).toContain("[data-chart=chart-testscriptalert1script]");
  });

  it("sanitizes malicious config keys against CSS breakout", () => {
    const config: ChartConfig = {
      "bad; } body { background: red; }": {
        label: "Malicious Key",
        color: "#ff0000",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).toContain("--color-badbodybackgroundred:");
  });

  it("sanitizes malicious color values and blocks url() SSRF/tracking constructs", () => {
    const config: ChartConfig = {
      sessions: {
        label: "Sessions",
        color: "red; } body { background: url('http://evil.com/leak'); }",
      },
      tokens: {
        label: "Tokens",
        color: "url('http://attacker.com/pixel.png')",
      },
      valid: {
        label: "Valid",
        color: "hsl(200, 80%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="sec-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("http://evil.com");
    expect(styleContent).not.toContain("http://attacker.com");

    expect(styleContent).not.toContain("body {");

    expect(styleContent).toContain("--color-valid: hsl(200, 80%, 50%);");
  });
});
