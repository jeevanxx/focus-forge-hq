import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ChartContainer } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

describe("Chart security sanitization", () => {
  it("sanitizes malicious id to prevent CSS attribute selector breakout", () => {
    const maliciousId = `malicious-id}\nbody{background:red;}\n[data-chart=bad`;
    const config = {
      desktop: { label: "Desktop", color: "#123456" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // Ensure injected CSS rule is blocked
    expect(styleContent).not.toContain("body{background:red;}");
    // Ensure sanitized data-chart attribute selector is present
    expect(styleContent).toContain("[data-chart=chart-malicious-idbodybackgroundreddata-chartbad]");
  });

  it("sanitizes malicious config key names to prevent CSS property breakout", () => {
    const config = {
      "injectedKey}; body{display:none;} --fake": {
        label: "Malicious Key",
        color: "#123456",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("body{display:none;}");
    expect(styleContent).toContain("--color-injectedKeybodydisplaynone--fake: #123456;");
  });

  it("sanitizes CSS breakout characters in color values", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: "#123456;} body{background:blue;} .fake{",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("body{background:blue;}");
    expect(styleContent).toContain("--color-desktop: #123456 bodybackground:blue .fake;");
  });

  it("blocks url() constructs in color values to prevent SSRF and tracking pixel leaks", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: "url(https://attacker.com/tracking-pixel.png)",
      },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    const styleContent = styleEl?.textContent || "";

    expect(styleContent).not.toContain("url(");
    expect(styleContent).not.toContain("attacker.com");
    expect(styleContent).not.toContain("--color-desktop:");
  });
});
