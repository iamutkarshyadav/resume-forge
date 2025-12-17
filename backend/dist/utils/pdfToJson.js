"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfToJson = pdfToJson;
async function pdfToJson(buffer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFParser = require("pdf2json");
    return await new Promise((resolve, reject) => {
        try {
            const pdfParser = new PDFParser();
            const onDataReady = (pdfData) => {
                try {
                    const pagesRaw = (pdfData && pdfData.Pages) || [];
                    const pages = [];
                    const allParts = [];
                    for (const p of pagesRaw) {
                        const texts = Array.isArray(p.Texts) ? p.Texts : [];
                        const items = [];
                        for (const t of texts) {
                            const runs = Array.isArray(t.R) ? t.R : [];
                            for (const r of runs) {
                                let value = String(r.T ?? "");
                                try {
                                    value = decodeURIComponent(value);
                                }
                                catch { /* noop */ }
                                const text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
                                if (!text)
                                    continue;
                                items.push({ x: t.x, y: t.y, w: t.w, s: r.S, text });
                                allParts.push(text);
                            }
                        }
                        pages.push({ width: p.Width, height: p.Height, text: items });
                    }
                    const allText = allParts.join(" ").replace(/\s+$/g, "").trim();
                    resolve({ pages, allText });
                }
                catch (err) {
                    reject(err);
                }
                finally {
                    try {
                        pdfParser.removeAllListeners();
                    }
                    catch { }
                }
            };
            const onError = (err) => {
                try {
                    pdfParser.removeAllListeners();
                }
                catch { }
                reject(err || new Error("Failed to parse PDF"));
            };
            pdfParser.on("pdfParser_dataReady", onDataReady);
            pdfParser.on("pdfParser_dataError", onError);
            try {
                pdfParser.parseBuffer(buffer);
            }
            catch (e) {
                onError(e);
            }
        }
        catch (e) {
            reject(e);
        }
    });
}
