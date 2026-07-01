import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ChartContainer, ChartConfig } from "../components/ui/chart";

describe("ChartContainer Security", () => {
  it("should sanitize malicious id prop", () => {
    const maliciousId = '"><style>body{background:red}</style>';
    const config: ChartConfig = {
      test: { label: "Test", color: "red" },
    };

    const { container } = render(
      <ChartContainer id={maliciousId} config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    // Malicious characters should be stripped out from the ID
    expect(styleTag?.innerHTML).not.toContain(maliciousId);
    expect(styleTag?.innerHTML).toContain('stylebodybackgroundredstyle');
  });

  it("should sanitize malicious config keys", () => {
    const maliciousKey = 'test; --injection: injected;';
    const config: ChartConfig = {
      [maliciousKey]: { label: "Test", color: "red" },
    };

    const { container } = render(
      <ChartContainer id="safe-id" config={config}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    // Semicolon and space should be stripped. Note: sanitizeId replaces them with empty string
    expect(styleTag?.innerHTML).not.toContain(maliciousKey);
    // Based on received: --color-test--injectioninjected
    // wait, why two dashes?
    // Oh, I see: "test; --injection: injected;" -> "test--injectioninjected"
    expect(styleTag?.innerHTML).toContain('--color-test--injectioninjected');
  });

  it("should sanitize malicious color values", () => {
    const maliciousColor = 'red; background: url(javascript:alert(1))';
    const config: ChartConfig = {
        test: { label: "Test", color: maliciousColor },
    };

    const { container } = render(
        <ChartContainer id="safe-id" config={config}>
          <div />
        </ChartContainer>
      );

      const styleTag = container.querySelector("style");
      expect(styleTag?.innerHTML).not.toContain(maliciousColor);
      // It should strip out the dangerous characters including :
      expect(styleTag?.innerHTML).toContain('redbackgroundurl(javascriptalert(1))');
  });
});
