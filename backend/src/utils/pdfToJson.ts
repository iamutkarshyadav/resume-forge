type PdfTextItem = { x: number; y: number; w?: number; s?: number; text: string };
export type PdfJsonPage = { width: number; height: number; text: PdfTextItem[] };
export type PdfJson = { pages: PdfJsonPage[]; allText: string };

export async function pdfToJson(buffer: Buffer): Promise<PdfJson> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PDFParser = require("pdf2json");

  return await new Promise<PdfJson>((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();

      const onDataReady = (pdfData: any) => {
        try {
          const pagesRaw: any[] = (pdfData && pdfData.Pages) || [];
          const pages: PdfJsonPage[] = [];
          const allParts: string[] = [];

          for (const p of pagesRaw) {
            const texts = Array.isArray(p.Texts) ? p.Texts : [];
            const items: PdfTextItem[] = [];
            for (const t of texts) {
              const runs = Array.isArray(t.R) ? t.R : [];
              for (const r of runs) {
                let value = String(r.T ?? "");
                try { value = decodeURIComponent(value); } catch { /* noop */ }
                const text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
                if (!text) continue;
                items.push({ x: t.x, y: t.y, w: t.w, s: r.S, text });
                allParts.push(text);
              }
            }
            pages.push({ width: p.Width, height: p.Height, text: items });
          }

          const allText = allParts.join(" ").replace(/\s+$/g, "").trim();
          resolve({ pages, allText });
        } catch (err) {
          reject(err);
        } finally {
          try { pdfParser.removeAllListeners(); } catch {}
        }
      };

      const onError = (err: any) => {
        try { pdfParser.removeAllListeners(); } catch {}
        reject(err || new Error("Failed to parse PDF"));
      };

      pdfParser.on("pdfParser_dataReady", onDataReady);
      pdfParser.on("pdfParser_dataError", onError);
      try {
        pdfParser.parseBuffer(buffer);
      } catch (e) {
        onError(e);
      }
    } catch (e) {
      reject(e);
    }
  });
}
