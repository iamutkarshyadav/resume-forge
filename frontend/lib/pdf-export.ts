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

      // --- NEW LOGIC FOR DESCRIPTION TRANSFORMATION ---
      // Check if this element's children appear to be description points (e.g., list items or paragraphs)
      const children = Array.from(el.children) as HTMLElement[];
      
      const isLikelyDescriptionList = children.length > 0 && children.every(child =>
        child.tagName === 'LI' && child.textContent && child.textContent.trim().length > 0
      );

      const isLikelyConsecutiveParagraphs = children.length > 0 && children.every(child =>
        child.tagName === 'P' && child.textContent && child.textContent.trim().length > 0
      );
      
      if (isLikelyDescriptionList || isLikelyConsecutiveParagraphs) {
          // Determine the separator based on whether it's a list or paragraphs
          const separator = isLikelyDescriptionList ? '\n• ' : '\n\n';
          // Join the text content of children into a single string
          const descriptionText = children.map(child => child.textContent?.trim()).filter(Boolean).join(separator);

          if (descriptionText) {
              // Set the element's text content directly. Prepend a bullet for lists.
              el.textContent = (isLikelyDescriptionList ? '• ' : '') + descriptionText;
              el.style.whiteSpace = 'pre-wrap'; // Ensure newlines are preserved for multi-line text
          } else {
              // If descriptionText is empty, clear the element's content
              el.textContent = '';
          }
          
          // Remove all original children as we've replaced the content with a text node.
          // This prevents html2canvas from trying to render the original LI/P elements.
          while (el.firstChild) {
              el.removeChild(el.firstChild);
          }
          // Re-append the text content as a text node
          el.appendChild(document.createTextNode(el.textContent || ''));
          
          return; // Stop recursion for this branch as content has been transformed.
      }
      // --- END NEW LOGIC ---

      // Remove all classes and data attributes that might cause issues
      el.removeAttribute("class");
      el.removeAttribute("data-*");

      // Process children (only if not transformed above)
      children.forEach((child) => {
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
