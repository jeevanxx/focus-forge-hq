import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ChartContainer, ChartStyle, ChartConfig } from "@/components/ui/chart";

// Mock ResponsiveContainer since Recharts has issues in jsdom
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-responsive-container">{children}</div>
    ),
  };
});

describe("Chart Security and Sanitization", () => {
  it("sanitizes malicious id values in ChartContainer and ChartStyle", () => {
    const config: ChartConfig = {
      testKey: { label: "Test Label", color: "blue" },
    };

    const maliciousId = "chart-id-malicious; breakout {} </style><script>alert('xss')</script>";

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Ensure the container has the sanitized ID (no spaces, punctuation or html tags)
    const element = container.querySelector("[data-chart]");
    expect(element).toBeTruthy();

    const chartIdAttr = element?.getAttribute("data-chart");
    expect(chartIdAttr).not.toContain(" ");
    expect(chartIdAttr).not.toContain(";");
    expect(chartIdAttr).not.toContain("<");
    expect(chartIdAttr).not.toContain(">");
    expect(chartIdAttr).not.toContain("}");
    expect(chartIdAttr).toBe("chart-chart-id-maliciousbreakoutstylescriptalertxssscript");
  });

  it("sanitizes config keys and prevents CSS rule breakout", () => {
    // Malicious config key containing characters meant to break out of style definition
    const maliciousKey = "maliciousKey; } .dark [data-chart] { background: url('malicious-site');";
    const config: ChartConfig = {
      [maliciousKey]: { label: "Label", color: "red" },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();

    const cssContent = styleTag?.innerHTML || "";
    // The key should have been sanitized to contain only a-zA-Z0-9_-
    expect(cssContent).not.toContain("; } .dark [data-chart] {");
    expect(cssContent).toContain("--color-maliciousKeydarkdata-chartbackgroundurlmalicious-site: red;");
  });

  it("preserves legitimate CSS functions and variables in colors", () => {
    const config: ChartConfig = {
      testKey: {
        label: "Label",
        color: "hsl(var(--chart-1))"
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();

    const cssContent = styleTag?.innerHTML || "";
    // legitimate HSL variables/functions must be preserved fully
    expect(cssContent).toContain("--color-testKey: hsl(var(--chart-1));");
  });

  it("sanitizes malicious color values", () => {
    const config: ChartConfig = {
      testKey: {
        label: "Label",
        color: "red; } [data-chart] { display: none } </style><script>alert(1)</script>"
      },
    };

    const { container } = render(
      <ChartContainer id="test" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeTruthy();

    const cssContent = styleTag?.innerHTML || "";
    // Ensure malicious payload elements like breakout semicolons/braces, style tags, and script elements are stripped
    expect(cssContent).not.toContain("red;");
    expect(cssContent).not.toContain("display: none }");
    expect(cssContent).not.toContain("[data-chart]");
    expect(cssContent).not.toContain("</style>");
    expect(cssContent).not.toContain("<script>");

    // Parentheses are preserved, but other breakout characters (brackets, tags, etc.) are stripped
    expect(cssContent).toContain("red  data-chart  display: none  /stylescriptalert(1)/script");
  });
});
