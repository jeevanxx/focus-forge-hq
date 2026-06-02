import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChartContainer } from "./chart";

// Mock Recharts since it doesn't play well with jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("ChartContainer Security", () => {
  it("sanitizes malicious id to prevent CSS selector breakout", () => {
    const maliciousId = '"><script>alert(1)</script>';
    const config = {
      test: { label: "Test", color: "#000" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain(maliciousId);
    // It should contain the sanitized version (with chart- prefix)
    const sanitizedId = `chart-${maliciousId.replace(/[^a-zA-Z0-9-_:.]/g, "")}`;
    expect(styleTag?.innerHTML).toContain(`[data-chart="${sanitizedId}"]`);
  });

  it("preserves colons and dots in chart id", () => {
    const idWithSpecialChars = "my:chart.id";
    const config = {
      test: { label: "Test", color: "#000" },
    };

    const { container } = render(
      <ChartContainer id={idWithSpecialChars} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).toContain(`[data-chart="chart-${idWithSpecialChars}"]`);
  });

  it("sanitizes malicious config keys", () => {
    const maliciousKey = 'test"; breakout: { }';
    const config = {
      [maliciousKey]: { label: "Test", color: "#000" },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain(maliciousKey);
    const sanitizedKey = maliciousKey.replace(/[^a-zA-Z0-9-_]/g, "");
    expect(styleTag?.innerHTML).toContain(`--color-${sanitizedKey}`);
  });

  it("sanitizes malicious color values", () => {
    const maliciousColor = "#000; } body { background: red; }";
    const config = {
      test: { label: "Test", color: maliciousColor },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain(maliciousColor);
    const sanitizedColor = maliciousColor.replace(/[;{}<>\\]/g, "");
    expect(styleTag?.innerHTML).toContain(`--color-test: ${sanitizedColor}`);
  });
});
