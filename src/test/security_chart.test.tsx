import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChartContainer } from "../components/ui/chart";
import * as React from "react";

// Mock ResponsiveContainer as it doesn't work well in JSDOM
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe("ChartContainer Security", () => {
  it("should not allow CSS injection via id prop", () => {
    // Attempt to break out of the attribute selector and inject a new rule
    const maliciousId = 'malicious-id] { background: red; } .other-selector';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{ test: { color: "blue" } }}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    // If vulnerable, the style content will contain the injected rule
    // [data-chart=chart-malicious-id] { background: red; } .other-selector] { ... }
    expect(styleContent).not.toContain("background: red");
  });

  it("should not allow CSS injection via config keys", () => {
    // Attempt to inject a new rule via a config key
    const maliciousKey = 'test: blue; } .injected { background: green; } .dummy';
    const { container } = render(
      <ChartContainer config={{ [maliciousKey]: { color: "red" } }}>
        <div />
      </ChartContainer>
    );

    const styleTag = container.querySelector("style");
    const styleContent = styleTag?.innerHTML || "";

    expect(styleContent).not.toContain("background: green");
  });

  it("should not allow breaking out of the style tag", () => {
    const maliciousId = 'safe-id</style><script>alert("xss")</script>';
    const { container } = render(
      <ChartContainer id={maliciousId} config={{ test: { color: "blue" } }}>
        <div />
      </ChartContainer>
    );

    // Check if script tag exists in the document
    const scriptTag = document.querySelector("script");
    const scriptContent = scriptTag?.innerHTML || "";
    expect(scriptContent).not.toContain('alert("xss")');
  });
});
