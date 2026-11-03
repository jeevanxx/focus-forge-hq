import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle } from "../components/ui/chart";
import React from "react";

describe("ChartStyle Security", () => {
  it("sanitizes id and config keys to prevent CSS injection and XSS", () => {
    const maliciousId = '"><script>alert("xss")</script>';
    const maliciousKey = '"><img src=x onerror=alert(1)>';
    const maliciousColor = 'red; </style><script>alert("xss")</script>';
    const config = {
      [maliciousKey]: {
        color: maliciousColor,
      },
    };

    const { container } = render(<ChartStyle id={maliciousId} config={config} />);
    const styleTag = container.querySelector("style");

    expect(styleTag).toBeTruthy();
    const styleContent = styleTag?.innerHTML || "";

    // Check that < is escaped
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).toContain("&lt;script>");

    // Check that id is sanitized
    expect(styleContent).toContain('[data-chart="scriptalertxssscript"]');

    // Check that key is sanitized
    expect(styleContent).toContain("--color-imgsrcxonerroralert1:");
  });

  it("allows safe characters in id and keys", () => {
    const safeId = "chart-123:abc_def";
    const safeKey = "my-custom_key:123";
    const config = {
      [safeKey]: {
        color: "blue",
      },
    };

    const { container } = render(<ChartStyle id={safeId} config={config} />);
    const styleTag = container.querySelector("style");

    expect(styleTag).toBeTruthy();
    const styleContent = styleTag?.innerHTML || "";

    expect(styleContent).toContain(`[data-chart="${safeId}"]`);
    expect(styleContent).toContain(`--color-${safeKey}: blue;`);
  });
});
