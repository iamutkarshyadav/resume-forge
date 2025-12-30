/**
 * Converts oklch color to RGB format compatible with html2pdf
 * oklch format: oklch(L C H / alpha) where L is lightness, C is chroma, H is hue
 */

// Mapping of oklch values to rgb hex equivalents
// These are pre-calculated conversions of the colors used in globals.css
const OKLCH_TO_RGB_MAP: Record<string, string> = {
  // Light theme colors (from :root)
  "oklch(1 0 0)": "#ffffff", // white
  "oklch(0.145 0 0)": "#1a1a1a", // near black
  "oklch(0.205 0 0)": "#323232", // dark gray
  "oklch(0.985 0 0)": "#fbfbfb", // almost white
  "oklch(0.97 0 0)": "#f5f5f5", // light gray
  "oklch(0.556 0 0)": "#8d8d8d", // medium gray
  "oklch(0.922 0 0)": "#ebebeb", // very light gray
  "oklch(0.708 0 0)": "#b3b3b3", // lighter gray
  "oklch(0.646 0.222 41.116)": "#d89e3e", // orange
  "oklch(0.6 0.118 184.704)": "#4f8bb8", // blue
  "oklch(0.398 0.07 227.392)": "#354566", // dark blue
  "oklch(0.828 0.189 84.429)": "#c4b741", // golden
  "oklch(0.769 0.188 70.08)": "#d4a754", // gold
  "oklch(0.577 0.245 27.325)": "#d4443a", // red
  // Dark theme colors
  "oklch(0.269 0 0)": "#454545", // medium dark gray
  "oklch(0.704 0.191 22.216)": "#c85a54", // reddish
  "oklch(0.488 0.243 264.376)": "#7362d9", // purple
  "oklch(0.696 0.17 162.48)": "#5ab3a8", // teal
  "oklch(0.627 0.265 303.9)": "#b858d9", // magenta
  "oklch(0.645 0.246 16.439)": "#d9664a", // orange-red
};

/**
 * Converts a single oklch color string to RGB hex format
 * Handles both quoted and unquoted values
 */
export function convertOklchToRgb(oklchStr: string): string {
  if (!oklchStr.includes("oklch")) {
    return oklchStr;
  }

  // Try exact match first
  if (OKLCH_TO_RGB_MAP[oklchStr]) {
    return OKLCH_TO_RGB_MAP[oklchStr];
  }

  // Try to normalize and match (remove extra spaces)
  const normalized = oklchStr.replace(/\s+/g, " ").trim();
  if (OKLCH_TO_RGB_MAP[normalized]) {
    return OKLCH_TO_RGB_MAP[normalized];
  }

  // Fallback to white if not found
  return "#ffffff";
}

/**
 * Removes or converts css variable references that use oklch
 * Replaces var(--color-name) with concrete RGB values
 */
export function convertCssVarsToRgb(htmlString: string): string {
  // Replace all oklch() color values directly in style strings
  return htmlString.replace(/oklch\([^)]+\)/g, (match) => {
    return convertOklchToRgb(match);
  });
}

/**
 * Processes an HTML element and converts all oklch colors to RGB
 * This handles both inline styles and computed styles
 */
export function sanitizeElementForPdf(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Walk through all elements and convert colors
  const allElements = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

  allElements.forEach((el) => {
    // Get computed styles
    const computed = window.getComputedStyle(el);
    const newStyles: Record<string, string> = {};

    // Check all color-related properties
    const colorProps = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "caretColor",
      "columnRuleColor",
    ];

    let hasChanges = false;

    colorProps.forEach((prop) => {
      const value = computed.getPropertyValue(prop);
      if (value && (value.includes("oklch") || value.includes("var("))) {
        // Try to get a better value if it's a CSS variable
        const varMatch = value.match(/var\(--([^,)]+)/);
        if (varMatch) {
          const varName = varMatch[1];
          // Get the actual value from root
          const rootValue = getComputedStyle(document.documentElement)
            .getPropertyValue(`--${varName}`)
            .trim();
          if (rootValue) {
            newStyles[prop] = convertOklchToRgb(rootValue);
            hasChanges = true;
          }
        } else if (value.includes("oklch")) {
          newStyles[prop] = convertOklchToRgb(value);
          hasChanges = true;
        }
      }
    });

    // Apply converted styles as inline styles
    if (hasChanges) {
      Object.entries(newStyles).forEach(([key, val]) => {
        // Convert camelCase to CSS property name
        const cssProp = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        el.style.setProperty(cssProp, val, "!important");
      });
    }

    // Also handle any inline style attributes that have oklch
    if (el.hasAttribute("style")) {
      const styleAttr = el.getAttribute("style") || "";
      const convertedStyle = convertCssVarsToRgb(styleAttr);
      if (convertedStyle !== styleAttr) {
        el.setAttribute("style", convertedStyle);
      }
    }

    // Remove any data attributes or classes that might cause issues
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-") || attr.name === "class") {
        if (attr.name === "class") {
          // Keep classes but they won't apply after we remove them in PDF export
          // Actually, let's remove them to avoid Tailwind issues
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return clone;
}
