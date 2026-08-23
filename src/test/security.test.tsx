import { render } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

describe("Chart Security Sanitization", () => {
  beforeEach(() => {
    // Mock ResizeObserver for Recharts ResponsiveContainer in jsdom
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("sanitizes malicious CSS injection attempt in chart id", () => {
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "hsl(120, 50%, 50%)" },
    };

    const maliciousId = 'test"}</style><script>alert(1)</script>';
    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert(1)");
    expect(styleContent).not.toContain('test"}');
    expect(styleContent).toContain("[data-chart=chart-teststylescriptalert1script]");
  });

  it("sanitizes malicious CSS key injection attempt", () => {
    const config: ChartConfig = {
      'primary; } body { background: red; }': {
        label: "Primary",
        color: "#123456",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    expect(styleContent).not.toContain("body { background: red; }");
    expect(styleContent).toContain("--color-primarybodybackgroundred:");
  });

  it("sanitizes malicious CSS color injection attempt and strips url() constructs", () => {
    const config: ChartConfig = {
      tracking: {
        label: "Tracking Attack",
        color: "red; } body { display: none; } /*",
      },
      externalUrl: {
        label: "SSRF Leak Attack",
        color: "url('https://attacker.com/leak.png')",
      },
      validColor: {
        label: "Valid Color",
        color: "hsl(210, 100%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="color-test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).not.toContain("url('https://attacker.com/leak.png')");
    expect(styleContent).not.toContain("externalUrl");
    expect(styleContent).toContain("--color-validColor: hsl(210, 100%, 50%);");
  });
});
