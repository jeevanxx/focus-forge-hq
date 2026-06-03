import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChartContainer } from "./chart";
import * as React from "react";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("Chart Security", () => {
  it("should prevent CSS injection through chart id", () => {
    // Malicious ID attempting to break out of the selector and inject a new rule
    const maliciousId = 'inject] { background: red; } [data-chart=nothing';
    const config = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // It should NOT contain the unescaped malicious string that breaks the CSS structure
    // Current vulnerable code will produce: [data-chart=chart-inject] { background: red; } [data-chart=nothing]
    expect(styleContent).not.toContain("} [data-chart=nothing]");
    // It should not have been able to inject a background rule
    expect(styleContent).not.toMatch(/}\s*\[data-chart=[^\]]*\]\s*{\s*background:\s*red/);
  });

  it("should prevent CSS injection through config keys", () => {
    // Malicious key attempting to break out of the property and inject a new rule
    const maliciousKey = 'test; --injection: red; } .malicious { background: red; } [data-chart] { --fake';
    const config = {
      [maliciousKey]: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // The injection attempts to close the block with '}' and start '.malicious'
    expect(styleContent).not.toContain("} .malicious");
  });

  it("should prevent CSS injection through color values", () => {
    // Malicious color attempting to break out of the property and inject a new rule
    const maliciousColor = "blue; } .malicious { background: red; }";
    const config = {
      test: { label: "Test", color: maliciousColor },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // The injection attempts to close the block with '}' and start '.malicious'
    expect(styleContent).not.toContain("} .malicious");
  });
});
