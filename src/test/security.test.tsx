import { render } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import * as React from "react";

// Local mock of ResizeObserver for Recharts
beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

describe("Chart Security and Sanitization", () => {
  it("correctly sanitizes malicious container id and prevents HTML/CSS breakout", () => {
    const maliciousId = `test-id" { } </style><script>alert('XSS')</script>`;
    const config: ChartConfig = {
      desktop: {
        label: "Desktop",
        color: "blue",
      },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    // Verify that the wrapper div's data-chart attribute is sanitized
    const wrapper = container.querySelector("[data-chart]");
    expect(wrapper).toBeInTheDocument();

    const dataChartAttr = wrapper?.getAttribute("data-chart");
    expect(dataChartAttr).not.toContain("</style>");
    expect(dataChartAttr).not.toContain("<script>");
    expect(dataChartAttr).not.toContain('"');
    expect(dataChartAttr).not.toContain(" ");
    expect(dataChartAttr).toBe("chart-test-idstylescriptalertXSSscript");

    // Verify that the style tag's content uses the sanitized ID and prevents escape
    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    const styleContent = styleTag?.textContent || "";
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).toContain("[data-chart=chart-test-idstylescriptalertXSSscript]");
  });

  it("correctly sanitizes configuration keys used as CSS custom property names", () => {
    const config: ChartConfig = {
      // Key contains period, spaces, and breakout characters
      "desktop.value; } </style>": {
        label: "Desktop",
        color: "red",
      },
    };

    const { container } = render(
      <ChartContainer id="test-key" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    const styleContent = styleTag?.textContent || "";

    // Expect breakout characters, spaces, and periods to be removed
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("; }");
    expect(styleContent).not.toContain("desktop.value");
    expect(styleContent).toContain("--color-desktopvalue");
  });

  it("correctly sanitizes color values while allowing safe/modern CSS color formats", () => {
    const config: ChartConfig = {
      // Safe modern HSL color should be allowed
      hslColor: {
        label: "HSL",
        color: "hsl(215, 90.5%, 50.2%)",
      },
      // Safe CSS variable color should be allowed
      varColor: {
        label: "CSS Variable",
        color: "var(--primary-color)",
      },
      // Malicious color value trying to break out
      maliciousColor: {
        label: "Malicious",
        color: `red; } </style><script>alert('color-xss')</script>`,
      },
    };

    const { container } = render(
      <ChartContainer id="test-color" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeInTheDocument();
    const styleContent = styleTag?.textContent || "";

    // HTML/CSS breakout characters should be stripped
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");

    // Malicious color becomes sanitized but remains functional as safe string
    expect(styleContent).toContain("--color-maliciousColor: red  /stylescriptalert(color-xss)/script;");

    // Standard safe colors should remain correctly preserved
    expect(styleContent).toContain("--color-hslColor: hsl(215, 90.5%, 50.2%)");
    expect(styleContent).toContain("--color-varColor: var(--primary-color)");
  });
});
