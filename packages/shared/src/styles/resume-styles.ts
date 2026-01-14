/**
 * Universal CSS for resume rendering.
 * This is used for both the frontend HTML preview and the Puppeteer PDF export.
 */
export const RESUME_STYLES = `
  :root {
    --resume-base-font: 'Times New Roman', Times, serif;
    --resume-base-size: 10pt;
    --resume-line-height: 1.4;
    --resume-margin: 0.5in;
  }

  .resume-container {
    box-sizing: border-box;
    width: 100%;
    margin: 0 auto;
    font-family: var(--resume-base-font);
    font-size: var(--resume-base-size);
    line-height: var(--resume-line-height);
    color: #000;
    background-color: #fff;
    padding: var(--resume-margin);
    min-height: 11in;
  }

  .resume-header {
    text-align: center;
    margin-bottom: 12pt;
  }

  .resume-name {
    font-size: 18pt;
    font-weight: bold;
    margin: 0 0 4pt 0;
    text-transform: uppercase;
    letter-spacing: 1pt;
  }

  .resume-contact {
    font-size: 9pt;
    color: #333;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4pt;
  }

  .separator {
    margin: 0 2pt;
  }

  .resume-link {
    color: #333;
    text-decoration: none;
  }

  .resume-section {
    margin-bottom: 10pt;
  }

  .section-title {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    border-bottom: 1pt solid #000;
    padding-bottom: 2pt;
    margin-bottom: 6pt;
    letter-spacing: 0.5pt;
  }

  .resume-entry {
    margin-bottom: 8pt;
  }

  .entry-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 10.5pt;
    margin-bottom: 1pt;
  }

  .entry-subheader {
    display: flex;
    justify-content: space-between;
    font-style: italic;
    font-size: 10pt;
    color: #444;
    margin-bottom: 2pt;
  }

  .entry-description {
    font-size: 10pt;
    margin-bottom: 4pt;
    white-space: pre-wrap;
  }

  .resume-bullets {
    margin: 0;
    padding-left: 15pt;
    list-style-type: disc;
  }

  .bullet-item {
    margin-bottom: 2pt;
    font-size: 10pt;
  }

  .skills-grid {
    display: flex;
    flex-direction: column;
    gap: 2pt;
  }

  .skills-category {
    font-size: 10pt;
  }

  .category-name {
    font-weight: bold;
  }

  /* PDF-specific adjustments */
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .resume-container {
      padding: var(--resume-margin);
      box-shadow: none;
    }
  }

  /* Paper Preview (for browser UI) */
  .resume-paper {
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    width: 8.5in;
    min-height: 11in;
    margin: 2rem auto;
  }
`;
