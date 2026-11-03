import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

describe("ChartContainer Security & Sanitization", () => {
  it("sanitizes malicious characters from container id to prevent CSS/HTML breakout", () => {
    const maliciousId = `test-id" [data-chart] { color: red; } </style><script>alert('xss')</script>`;

    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(var(--primary))",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Get the element and its data-chart attribute
    const chartDiv = container.querySelector("[data-chart]");
    expect(chartDiv).not.toBeNull();

    const dataChartAttr = chartDiv?.getAttribute("data-chart");
    expect(dataChartAttr).toBeDefined();

    // Ensure the output contains ONLY alphanumeric, dashes, and underscores
    // The malicious id should be sanitized to remove spaces, brackets, tags, etc.
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain("[");
    expect(dataChartAttr).not.toContain("]");
    expect(dataChartAttr).not.toContain("<");
    expect(dataChartAttr).not.toContain(">");
    expect(dataChartAttr).not.toContain(" ");
  });

  it("sanitizes malicious characters in config keys to prevent CSS injection", () => {
    const maliciousKey = "desktop: { color: red; } .malicious { background: blue; }";

    const config: ChartConfig = {
      [maliciousKey]: {
        label: "Desktop",
        color: "#ff0000",
      },
    };

    const { container } = render(
      <ChartContainer id="test-key" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML;
    // Check that style content exists and does not contain raw curly braces or dots in the custom property declaration
    expect(styleContent).toBeDefined();
    expect(styleContent).not.toContain("desktop: { color: red; }");
    expect(styleContent).not.toContain(".malicious {");
  });

  it("sanitizes malicious characters in color values to prevent CSS rule and tag breakouts", () => {
    const maliciousColor = "red; } [data-chart] { background: url('malicious'); } </style><script>alert(1)</script>";

    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: maliciousColor,
      },
    };

    const { container } = render(
      <ChartContainer id="test-color" config={config}>
        <div />
      </ChartContainer>
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML;
    expect(styleContent).toBeDefined();

    // Ensure critical breakout characters are removed from the rendered style content
    expect(styleContent).not.toContain("red;");
    expect(styleContent).not.toContain("} [data-chart]");
    expect(styleContent).not.toContain("[data-chart]");
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
  });
});
