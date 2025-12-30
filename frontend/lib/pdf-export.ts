/**
 * PDF Export utility using html2pdf
 * Creates a clean, print-friendly version to avoid CSS parsing issues
 */

export async function exportResumeToPdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  try {
    // Dynamically import html2pdf
    const module = await import("html2pdf.js");
    const html2pdf = module.default;

    // Clone the element for processing
    const clone = element.cloneNode(true) as HTMLElement;

    // Create a clean version with inline styles only (no classes, no CSS variables)
    const processElement = (el: HTMLElement) => {
      // Get computed styles
      const computed = window.getComputedStyle(el);

      // Set essential styles as inline
      el.style.fontFamily = computed.fontFamily;
      el.style.fontSize = computed.fontSize;
      el.style.fontWeight = computed.fontWeight;
      el.style.lineHeight = computed.lineHeight;
      el.style.color = "#000000"; // Force black text
      el.style.backgroundColor = "transparent";
      el.style.margin = computed.margin;
      el.style.padding = computed.padding;
      el.style.textAlign = computed.textAlign;
      el.style.whiteSpace = computed.whiteSpace;

      // Remove all classes and data attributes that might cause issues
      el.removeAttribute("class");
      el.removeAttribute("data-*");

      // Process children
      Array.from(el.children).forEach((child) => {
        processElement(child as HTMLElement);
      });
    };

    processElement(clone);

    // Wrap in a white background container
    const container = document.createElement("div");
    container.style.backgroundColor = "#ffffff";
    container.style.padding = "0";
    container.style.margin = "0";
    container.appendChild(clone);

    // Create hidden temporary container
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.visibility = "hidden";
    tempContainer.appendChild(container);
    document.body.appendChild(tempContainer);

    // PDF options - minimal to avoid parsing issues
    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: fileName,
      image: { type: "image/png", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: false,
        // Ignore elements that might have problematic styles
        ignoreElements: (element: Element) => {
          const tag = element.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "META" || tag === "LINK") {
            return true;
          }
          return false;
        },
      },
      jsPDF: {
        orientation: "portrait",
        unit: "in",
        format: "letter",
        compress: true,
      },
      pagebreak: { mode: "avoid-all" },
    };

    // Generate and save PDF
    await new Promise<void>((resolve, reject) => {
      try {
        html2pdf()
          .set(options)
          .from(container)
          .save()
          .then(() => resolve())
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });

    // Clean up
    setTimeout(() => {
      try {
        document.body.removeChild(tempContainer);
      } catch (e) {
        // Element may have already been removed
      }
    }, 100);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to export resume as PDF. Please try again.");
  }
}
