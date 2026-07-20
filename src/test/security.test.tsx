import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChartStyle } from "@/components/ui/chart";

describe("ChartStyle security tests", () => {
  it("should sanitize malicious CSS rules and HTML injection payloads", () => {
    const maliciousConfig = {
      "desktop; border: 1px solid red;": {
        label: "Desktop",
        color:
          "red; background: url(malicious-site); } </style><script>alert('xss')</script>",
      },
    };

    const { container } = render(
      <ChartStyle id="chart-id-with-spaces; {}" config={maliciousConfig} />,
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";

    // The malicious ID should be sanitized to remove spaces, semicolon, and curly braces
    expect(styleContent).toContain("[data-chart=chart-id-with-spaces]");
    expect(styleContent).not.toContain("chart-id-with-spaces; {}");

    // The key should be sanitized to only allow alphanumeric/hyphen/underscore, removing semicolon and trailing styles
    expect(styleContent).toContain("--color-desktop");
    expect(styleContent).not.toContain("desktop;");

    // The malicious color should have blocked breakout characters
    // Semicolons should not exist within the value (though the declaration-terminating semicolon is expected)
    expect(styleContent).not.toContain("red;");
    expect(styleContent).not.toContain("url(malicious-site);");

    // The injection of style closing tags and script tags must be completely broken
    expect(styleContent).not.toContain("</style>");
    expect(styleContent).not.toContain("<script>");
    expect(styleContent).not.toContain("alert('xss')");
  });

  it("should allow valid modern CSS color characters and formats", () => {
    const validConfig = {
      desktop: {
        label: "Desktop",
        color: "hsl(215, 20.2%, 65.1%)",
      },
      mobile: {
        label: "Mobile",
        color: "rgba(255, 99, 132, 0.5)",
      },
    };

    const { container } = render(
      <ChartStyle id="chart-id" config={validConfig} />,
    );

    const styleElement = container.querySelector("style");
    expect(styleElement).not.toBeNull();

    const styleContent = styleElement?.innerHTML || "";

    // Check that HSL and RGBA colors remain intact
    expect(styleContent).toContain("--color-desktop: hsl(215, 20.2%, 65.1%)");
    expect(styleContent).toContain("--color-mobile: rgba(255, 99, 132, 0.5)");
  });
});
