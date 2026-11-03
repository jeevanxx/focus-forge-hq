import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChartContainer } from "../components/ui/chart";
import * as React from "react";

describe("ChartContainer Security", () => {
  it("should not allow CSS injection via id", () => {
    const maliciousId = '"] { background: red; } .malicious { color: green; } ["';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{}}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).toBeDefined();
    const styleContent = styleTag?.textContent || "";

    // If it's vulnerable, it will contain the raw malicious string
    // which breaks out of the [data-chart=...] selector
    expect(styleContent).not.toContain('] { background: red; }');
  });

  it("should not allow CSS injection via config keys", () => {
    const maliciousKey = "test; } .malicious { background: url('http://evil.com'); } --color-dummy";
    const config = {
      [maliciousKey]: { color: "red" },
    };
    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("} .malicious {");
  });

  it("should not allow CSS injection via color values", () => {
    const maliciousColor = "red; } .malicious { background: blue; }";
    const config = {
      test: { color: maliciousColor },
    };
    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.textContent || "";

    expect(styleContent).not.toContain("} .malicious {");
    expect(styleContent).toContain("--color-test: transparent;");
  });
});
