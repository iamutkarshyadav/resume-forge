"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrImage = ocrImage;
exports.renderPdfToImages = renderPdfToImages;
exports.ocrPdf = ocrPdf;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
async function ocrImage(buffer, lang = "eng") {
    const { data } = await tesseract_js_1.default.recognize(buffer, lang);
    const text = (data && data.text) ? String(data.text) : "";
    return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}
async function renderPdfToImages(pdfBuffer, scale = 2) {
    // Use pdfjs-dist to rasterize pages to PNG buffers
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createCanvas } = require("canvas");
    pdfjsLib.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/legacy/build/pdf.worker.js");
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const pageImages = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");
        // Render
        await page.render({ canvasContext: ctx, viewport }).promise;
        const pngBuffer = canvas.toBuffer("image/png");
        pageImages.push(pngBuffer);
    }
    return pageImages;
}
async function ocrPdf(pdfBuffer, lang = "eng") {
    const images = await renderPdfToImages(pdfBuffer);
    let full = "";
    for (const img of images) {
        const t = await ocrImage(img, lang);
        if (t)
            full += (full ? "\n\n" : "") + t;
    }
    return full.trim();
}
