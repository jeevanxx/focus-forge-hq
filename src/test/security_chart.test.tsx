import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartContainer, ChartStyle } from "../components/ui/chart";

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("Chart Security", () => {
  it("sanitizes chart ID in ChartContainer", () => {
    const maliciousId = "chart-id\"; background: url(javascript:alert(1)); \"";
    const { container } = render(
      <ChartContainer id={maliciousId} config={{}}>
        <div />
      </ChartContainer>
    );

    const div = container.querySelector("[data-chart]");
    expect(div).toBeTruthy();
    const chartId = div?.getAttribute("data-chart");
    // Should be sanitized to only allow alphanumeric and - _
    expect(chartId).not.toContain("\"");
    expect(chartId).not.toContain(";");
    expect(chartId).toBe("chart-chart-idbackgroundurljavascriptalert1");
  });

  it("sanitizes CSS keys and values in ChartStyle to prevent rule injection", () => {
    const config = {
      "malicious-key\"; } body { background: red; }": {
        color: "blue; background: url(javascript:alert(1))",
      },
    };

    const { container } = render(<ChartStyle id="test-chart" config={config} />);
    const styleElement = container.querySelector("style");
    expect(styleElement).toBeTruthy();

    const cssContent = styleElement?.innerHTML || "";

    // We want to ensure that the malicious parts that break out of the rule are GONE.
    // The semicolon in "--color-key: value;" is added by the component, so we check for double semicolons
    // or semicolons in the middle of what should be a single value.

    expect(cssContent).not.toContain("body { background: red; }");
    expect(cssContent).not.toContain("blue; background:");

    // Check for quoted attribute selector
    expect(cssContent).toContain("[data-chart=\"test-chart\"]");
  });
});
