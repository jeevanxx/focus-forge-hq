import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("Chart Security - CSS and HTML Injection Sanitization", () => {
  it("sanitizes malicious chart ID, config keys, and color values", () => {
    const maliciousConfig: ChartConfig = {
      "malicious</style><script>alert(1)</script>": {
        label: "Malicious Key",
        color: "red; } body { background: red; } /* url('http://attacker.com/leak') */",
      },
      safeKey: {
        label: "Safe Key",
        color: "hsl(var(--primary))",
      },
      urlKey: {
        label: "URL Injection Key",
        color: "url('https://attacker.com/pixel.png')",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart</style><script>alert('xss')</script>" config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.innerHTML || "";

    // Verify raw malicious tags/payloads are not injected into <style>
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert(1)");
    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).not.toContain("http://attacker.com/leak");
    expect(styleContent).not.toContain("https://attacker.com/pixel.png");

    // Verify safe values are present
    expect(styleContent).toContain("--color-safeKey: hsl(var(--primary));");
  });
});
