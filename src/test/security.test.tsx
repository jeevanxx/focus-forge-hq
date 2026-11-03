import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle } from "@/components/ui/chart";

describe("ChartStyle security and sanitization", () => {
  it("sanitizes malicious id values and quotes attribute selectors to prevent CSS breakout", () => {
    const maliciousId = `malicious" { } body { background: red; } /*`;
    const config = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();
    const styleContent = styleElement?.innerHTML || "";

    // The malicious characters must be stripped from the ID selector, and the selector must be quoted.
    expect(styleContent).toContain('[data-chart="maliciousbodybackgroundred"]');
    // Ensure there is no unescaped breakout brace with background manipulation.
    expect(styleContent).not.toContain('body { background: red; }');
  });

  it("sanitizes malicious config key values to prevent breakout", () => {
    const config = {
      "desktop; breakout-prop: value": {
        label: "Desktop",
        color: "#ff0000",
      },
    };

    const { container } = render(<ChartStyle id="safe-id" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();
    const styleContent = styleElement?.innerHTML || "";

    // The key should have semicolon and space stripped or replaced, converting to a safe CSS property segment.
    expect(styleContent).toContain("--color-desktopbreakout-propvalue: #ff0000;");
  });

  it("sanitizes malicious color values to prevent breakout", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: "red; } body { background: blue; } /*",
      },
    };

    const { container } = render(<ChartStyle id="safe-id" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();
    const styleContent = styleElement?.innerHTML || "";

    // Breakout characters like semicolon, braces, slash, asterisks are neutralized or stripped.
    expect(styleContent).not.toContain("body { background: blue; }");
    expect(styleContent).toContain("--color-desktop: red  body  background blue");
  });
});
