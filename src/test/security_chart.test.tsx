import { render } from "@testing-library/react";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Chart Security", () => {
  it("should sanitize id to prevent CSS injection", () => {
    const maliciousId = 'injection] { background: red; } [data-chart=normal';
    const config: ChartConfig = {
      test: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    // If it's vulnerable, the innerHTML will contain the raw malicious string breaking the selector
    // We expect it to be sanitized or at least not allow breaking out of the block
    expect(styleTag?.innerHTML).not.toContain('background: red;');
  });

  it("should sanitize config keys to prevent CSS injection", () => {
    const maliciousKey = 'test; --injection: red; } .malicious { background: red; } --color-dummy';
    const config: ChartConfig = {
      [maliciousKey]: { label: "Test", color: "blue" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).not.toContain('.malicious { background: red; }');
  });

  it("should sanitize color values to prevent CSS injection", () => {
     const maliciousColor = 'blue; --injection: red; } .malicious { background: red; }';
     const config: ChartConfig = {
       test: { label: "Test", color: maliciousColor },
     };

     const { container } = render(
       <ChartContainer config={config}>
         <div />
       </ChartContainer>
     );

     const styleTag = container.querySelector("style");
     expect(styleTag?.innerHTML).not.toContain('.malicious { background: red; }');
  });

  it("should allow dots in config keys but sanitize other characters", () => {
    const keyWithDot = 'test.key';
    const maliciousKey = 'test.key; background: red;';
    const config: ChartConfig = {
      [keyWithDot]: { label: "Test", color: "blue" },
      [maliciousKey]: { label: "Malicious", color: "red" },
    };

    const { container } = render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag?.innerHTML).toContain('--color-test.key: blue;');
    expect(styleTag?.innerHTML).not.toContain('background: red;');
    // The malicious part '; background: red;' should be stripped
    expect(styleTag?.innerHTML).toContain('--color-test.keybackgroundred: red;');
  });
});
