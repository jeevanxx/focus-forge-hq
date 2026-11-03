import { describe, test, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";

// Mock ResizeObserver for recharts / responsive container
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("ChartContainer Security", () => {
  test("sanitizes malicious id in ChartContainer", () => {
    const maliciousId = `test" style="background:red;"<script>alert(1)</script>`;
    const config = {
      desktop: {
        label: "Desktop",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");

    expect(dataChartAttr).toBe("chart-teststylebackgroundredscriptalert1script");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain('<');
    expect(dataChartAttr).not.toContain('>');

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).not.toContain("<script>");
  });

  test("sanitizes malicious CSS injection and url() in color values", () => {
    const config = {
      desktop: {
        label: "Desktop",
        color: `red; } body { background: url('https://attacker.com/leak.png'); }`,
      },
      mobile: {
        label: "Mobile",
        color: "hsl(210, 100%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleText = styleEl?.innerHTML || "";

    expect(styleText).not.toContain("url(");
    expect(styleText).not.toContain("https://attacker.com/leak.png");
    expect(styleText).not.toContain("red;");
    expect(styleText).toContain("--color-mobile: hsl(210, 100%, 50%)");
  });

  test("sanitizes key names in config", () => {
    const config = {
      'desktop"; } body { color: red; }': {
        label: "Desktop",
        color: "#2563eb",
      },
    };

    const { container } = render(
      <ChartContainer id="chart-keys" config={config}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleText = styleEl?.innerHTML || "";

    expect(styleText).not.toContain('desktop";');
    expect(styleText).toContain("--color-desktopbodycolorred");
  });
});
