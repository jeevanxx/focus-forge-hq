import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts / JSDOM environment
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Tests", () => {
  it("sanitizes malicious id, key, and color inputs in ChartStyle element", () => {
    const maliciousConfig: ChartConfig = {
      "desktop}; body{background:red}": {
        label: "Desktop",
        color: "red; } </style><script>alert('xss')</script>",
      },
      ssrfKey: {
        label: "SSRF Attempt",
        color: "url(https://malicious.com/pixel.png)",
      },
    };

    const { container } = render(
      <ChartContainer id='test-chart"></style><script>alert(1)</script>' config={maliciousConfig}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Verify HTML tags are stripped/escaped from ID
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).toContain("[data-chart=chart-test-chartstylescriptalert1script]");

    // Verify CSS breakout characters are sanitized from keys and colors
    expect(styleContent).not.toContain("body{background:red}");
    expect(styleContent).toContain("--color-desktopbodybackgroundred");
    expect(styleContent).not.toContain("alert('xss')");

    // Verify url() constructs are stripped to prevent SSRF / tracking pixel leaks
    expect(styleContent).not.toContain("url(https://malicious.com/pixel.png)");
    expect(styleContent).not.toContain("--color-ssrfKey");
  });
});
