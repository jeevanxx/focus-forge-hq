import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartContainer } from "@/components/ui/chart";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe("ChartContainer & ChartStyle Security Sanitization", () => {
  it("should sanitize malicious container id to prevent HTML and selector breakout", () => {
    const config = {
      test: {
        label: "Test",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id='malicious"><script>alert(1)</script>' config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const cssText = styleElement?.innerHTML || "";

    expect(cssText).not.toContain("<script>");
    expect(cssText).not.toContain("</script>");
    expect(cssText).not.toContain('"');
    expect(cssText).toContain("maliciousscriptalert1script");

    const rootDiv = container.querySelector("[data-chart]");
    expect(rootDiv?.getAttribute("data-chart")).toContain("chart-maliciousscriptalert1script");
  });

  it("should sanitize malicious config keys to prevent CSS rule breakout", () => {
    const maliciousConfig = {
      "malicious; } body { background: red; } /*": {
        label: "Malicious Key",
        color: "green",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    expect(cssText).not.toContain("malicious; } body { background: red; } /*");
    expect(cssText).toContain("--color-maliciousbodybackgroundred");
  });

  it("should sanitize breakout characters from color values", () => {
    const config = {
      test: {
        label: "Test",
        color: "red; } body { background: black; }",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    expect(cssText).not.toContain("red; } body { background: black; }");
    expect(cssText).toContain("red  body  background: black");

    // Standard delimiters: only 2 opening and 2 closing braces across light and dark theme blocks
    const openBraces = (cssText.match(/{/g) || []).length;
    const closeBraces = (cssText.match(/}/g) || []).length;
    expect(openBraces).toBe(2);
    expect(closeBraces).toBe(2);
  });

  it("should block CSS url() constructs in color values to prevent SSRF and tracking leaks", () => {
    const config = {
      test: {
        label: "Test",
        color: 'url("https://attacker.com/tracking.png")',
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    expect(cssText).not.toContain("attacker.com");
    expect(cssText).not.toContain("url(");
  });

  it("should preserve legitimate modern color function syntaxes like hsl() and var()", () => {
    const config = {
      test: {
        label: "Test",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    const cssText = styleElement?.innerHTML || "";

    expect(cssText).toContain("hsl(var(--primary))");
  });
});
