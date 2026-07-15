import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer } from "@/components/ui/chart";
import * as React from "react";

describe("Chart Security", () => {
  it("sanitizes malicious chart ID to prevent CSS breakout", () => {
    const maliciousId = '"><script>alert(1)</script>';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{}}>
        <div />
      </ChartContainer>
    );

    const div = container.querySelector("[data-chart]");
    expect(div).toBeTruthy();
    const chartId = div?.getAttribute("data-chart");
    // Should remove special characters
    expect(chartId).not.toContain('">');
    expect(chartId).not.toContain("<script>");
  });

  it("sanitizes malicious config keys and colors in ChartStyle", () => {
    const config = {
      'test"; breakout: {': {
        color: 'red; background: url("javascript:alert(1)")',
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const style = container.querySelector("style");
    expect(style).toBeTruthy();
    const css = style?.innerHTML;

    // Check that breakout characters are removed or handled
    expect(css).not.toContain('test"; breakout: {');
    expect(css).not.toContain('url("javascript:alert(1)")');
    // It should contain the sanitized versions
    expect(css).toContain('--color-testbreakout');
    expect(css).toContain('red background url(javascriptalert(1))');
  });
});
