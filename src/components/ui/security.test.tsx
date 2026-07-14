import { render } from "@testing-library/react";
import { ChartStyle } from "./chart";
import { describe, it, expect } from "vitest";

describe("ChartStyle Security", () => {
  it("sanitizes malicious id to prevent CSS injection", () => {
    const maliciousId = "chart-id] { background: red; } /*";
    const config = {
      test: { color: "blue" }
    };

    const { container } = render(
      <ChartStyle id={maliciousId} config={config} />
    );

    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const css = styleTag?.innerHTML;

    // The malicious part should be stripped or rendered harmlessly
    expect(css).not.toContain("] { background: red; }");
    expect(css).toContain('[data-chart="chart-idbackgroundred"]');
  });

  it("sanitizes malicious config keys to prevent CSS injection", () => {
    const id = "safe-id";
    const maliciousKey = "primary: blue; } body { background: red; } /*";
    const config = {
      [maliciousKey]: { color: "blue" }
    };

    const { container } = render(
      <ChartStyle id={id} config={config} />
    );

    const styleTag = container.querySelector("style");
    const css = styleTag?.innerHTML;

    expect(css).not.toContain("} body { background: red; }");
    expect(css).toContain("--color-primaryblue");
  });

  it("sanitizes malicious color values to prevent CSS injection", () => {
    const id = "safe-id";
    const config = {
      test: { color: "blue; } body { background: red; } /*" }
    };

    const { container } = render(
      <ChartStyle id={id} config={config} />
    );

    const styleTag = container.querySelector("style");
    const css = styleTag?.innerHTML;

    expect(css).not.toContain("} body { background: red; }");
    expect(css).toContain("--color-test: blue  body  background red  /*;");
  });

  it("allows safe characters in colors including alpha channel slash", () => {
    const id = "safe-id";
    const config = {
      test: { color: "hsl(var(--primary) / 0.5)" }
    };

    const { container } = render(
      <ChartStyle id={id} config={config} />
    );

    const styleTag = container.querySelector("style");
    const css = styleTag?.innerHTML;

    expect(css).toContain("--color-test: hsl(var(--primary) / 0.5)");
  });
});
