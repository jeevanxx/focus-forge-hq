import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// Mock ResizeObserver for Recharts ResponsiveContainer
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("ChartContainer Security Sanitization Tests", () => {
  it("should sanitize malicious characters in id to prevent CSS/HTML breakout", () => {
    const config: ChartConfig = {
      desktop: {
        color: "hsl(var(--primary))",
      },
    };

    // Malicious id attempting to break out of CSS rule or style tag
    const maliciousId = `test-id] { background: url('malicious') } </style><script>alert('XSS')</script>`;

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Check that style tag/CSS rule breakout was prevented
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("test-id]");
    expect(styleContent).not.toContain("{ background: url('malicious') }");

    // The sanitized id should only contain alphanumeric, dashes, and underscores
    expect(styleContent).toContain("[data-chart=chart-test-idbackgroundurlmaliciousstylescriptalertXSSscript]");
  });

  it("should sanitize malicious config keys used as CSS custom property names", () => {
    const config: ChartConfig = {
      "desktop; border: 1px solid red;": {
        color: "#ff0000",
      },
      "mobile.dot": {
        color: "#0000ff",
      },
      "tablet key": {
        color: "#00ff00",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Malicious character ";" and invalid CSS identifier characters ".", " " must be sanitized
    expect(styleContent).not.toContain("--color-desktop; border: 1px solid red;");
    expect(styleContent).not.toContain("--color-mobile.dot");
    expect(styleContent).not.toContain("--color-tablet key");

    // Checked sanitized variants
    expect(styleContent).toContain("--color-desktopborder1pxsolidred");
    expect(styleContent).toContain("--color-mobiledot");
    expect(styleContent).toContain("--color-tabletkey");
  });

  it("should sanitize malicious color values while preserving legitimate CSS color definitions", () => {
    const config: ChartConfig = {
      desktop: {
        color: "hsl(210, 100%, 50%); } [data-chart=test-chart] { background: red; }",
      },
      mobile: {
        color: "var(--primary); </style><script>alert(1)</script>",
      },
      tablet: {
        color: "rgb(0, 128, 0)",
      },
    };

    const { container } = render(
      <ChartContainer id="test-chart" config={config}>
        <div />
      </ChartContainer>
    );
    const styleElement = container.querySelector("style");

    expect(styleElement).not.toBeNull();
    const styleContent = styleElement?.innerHTML || "";

    // Check that we blocked critical breakout characters
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("} [data-chart=test-chart] {");

    // Legitimate functions like hsl() and rgb() and variables var() are still supported
    expect(styleContent).toContain("--color-desktop: hsl(210, 100%, 50%)  data-chart=test-chart  background: red ;");
    expect(styleContent).toContain("--color-mobile: var(--primary) /stylescriptalert(1)/script;");
    expect(styleContent).toContain("--color-tablet: rgb(0, 128, 0);");
  });
});
