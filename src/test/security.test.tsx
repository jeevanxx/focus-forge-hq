import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Chart Container Security Sanitization", () => {
  test("sanitizes malicious chart ID to prevent CSS attribute selector breakout", () => {
    const maliciousId = 'test"] { color: red; } </style><script>alert("xss")</script>';
    const config: ChartConfig = {
      desktop: { label: "Desktop", color: "#2563eb" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();
    const dataChartAttr = chartDiv?.getAttribute("data-chart");

    // Must not contain quotes, brackets, spaces, or script tags
    expect(dataChartAttr).toBe("chart-testcolorredstylescriptalertxssscript");
    expect(dataChartAttr).not.toContain("]");
    expect(dataChartAttr).not.toContain("<script>");

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
  });

  test("sanitizes malicious config keys and color values in generated CSS", () => {
    const maliciousConfig: ChartConfig = {
      'key"; } * { background: red; }': {
        label: "Malicious Key",
        color: 'hsl(120, 100%, 50%); } body { display: none; } /*',
      },
      'urlTest': {
        label: "URL Tracker",
        color: 'url("https://attacker.com/pixel.png")',
      },
      'validColor': {
        label: "Valid Color",
        color: 'hsl(220, 90%, 56%)',
      },
    };

    const { container } = render(
      <ChartContainer id="safe-chart" config={maliciousConfig}>
        <div data-testid="chart-child" />
      </ChartContainer>
    );

    const styleEl = container.querySelector("style");
    expect(styleEl).not.toBeNull();
    const styleContent = styleEl?.textContent || "";

    // Key sanitization: quotes, semicolons, and spaces stripped
    expect(styleContent).toContain("--color-keybackgroundred:");

    // Color sanitization: breakout characters (; { } /*) stripped safely
    expect(styleContent).not.toContain("body { display: none; }");
    expect(styleContent).toContain("hsl(120, 100%, 50%)  body  display none");
    expect(styleContent).toContain("--color-validColor: hsl(220, 90%, 56%);");

    // url() sanitization: blocked to prevent SSRF or tracking pixels
    expect(styleContent).not.toContain("https://attacker.com/pixel.png");
    expect(styleContent).not.toContain("--color-urlTest:");
  });
});
