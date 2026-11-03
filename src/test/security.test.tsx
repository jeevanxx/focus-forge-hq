import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle } from "@/components/ui/chart";

describe("ChartStyle Security Sanitization", () => {
  it("should sanitize malicious characters from id", () => {
    const maliciousId = 'chart-id"; background: url(x); }';
    const config = {
      test: {
        color: "blue",
      },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // The malicious id has characters like double quotes, semicolons, brackets, etc.
    // sanitizeId replaces anything other than [a-zA-Z0-9_-] with empty string.
    expect(styleContent).toContain("[data-chart=chart-idbackgroundurlx]");
    expect(styleContent).not.toContain('chart-id"');
  });

  it("should sanitize malicious keys", () => {
    const id = "chart-test";
    const config = {
      "maliciousKey; background: url(x);": {
        color: "blue",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Expected key is 'maliciousKeybackgroundurlx'
    expect(styleContent).toContain("--color-maliciousKeybackgroundurlx");
    expect(styleContent).not.toContain("maliciousKey;");
  });

  it("should sanitize malicious color values", () => {
    const id = "chart-test";
    const config = {
      test: {
        color: "blue; background: url(x); }",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Breakout characters like ';', '{', '}', and brackets are stripped from color value.
    // The only semicolon should be the one ending the CSS rule definition.
    expect(styleContent).toContain("--color-test: blue background: url(x) ;");
    expect(styleContent).not.toContain("blue;");
    expect(styleContent).not.toContain("url(x);");
    // Ensure no breakout closing curly bracket exists inside the style content (except the correct rule block endings)
    expect(styleContent).not.toContain("x) }");
  });

  it("should allow modern safe CSS colors with parentheses", () => {
    const id = "chart-test";
    const config = {
      hslColor: {
        color: "hsl(210, 100%, 50%)",
      },
      varColor: {
        color: "var(--primary)",
      },
    };

    const { container } = render(<ChartStyle id={id} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    expect(styleContent).toContain("--color-hslColor: hsl(210, 100%, 50%)");
    expect(styleContent).toContain("--color-varColor: var(--primary)");
  });
});
