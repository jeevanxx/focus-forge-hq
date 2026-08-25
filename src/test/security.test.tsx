import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("ChartContainer Security Sanitization", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("sanitizes malicious characters in container id and config keys", () => {
    const config: ChartConfig = {
      "malicious'key;": {
        label: "Malicious Key",
        color: "#ff0000",
      },
    };

    const { container } = render(
      <ChartContainer id="test'id;break" config={config}>
        <div />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    // Verify data-chart attribute only contains sanitized characters
    expect(chartDiv?.getAttribute("data-chart")).toBe("chart-testidbreak");

    // Check generated style tag content
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("test'id;break");
    expect(styleContent).not.toContain("malicious'key;");
    expect(styleContent).toContain("[data-chart=chart-testidbreak]");
    expect(styleContent).toContain("--color-maliciouskey: #ff0000");
  });

  it("sanitizes CSS breakout characters and blocks url() in colors", () => {
    const config: ChartConfig = {
      breakout: {
        label: "Breakout Test",
        color: "red; } body { display: none; }",
      },
      ssrf: {
        label: "SSRF Test",
        color: "url(https://malicious.attacker.com/leak.png)",
      },
      valid: {
        label: "Valid Color",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id="sec-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.textContent || "";

    // Breakout characters should be stripped
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("--color-breakout: red  body  display: none ;");

    // url(...) should be blocked entirely (resulting in empty string / omitted property)
    expect(styleContent).not.toContain("malicious.attacker.com");
    expect(styleContent).not.toContain("--color-ssrf");

    // Valid colors like hsl(var(...)) are preserved (since parentheses and commas are safe)
    expect(styleContent).toContain("--color-valid: hsl(var(--primary))");
  });
});
