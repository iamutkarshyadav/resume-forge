"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLayout = resolveLayout;
/**
 * A simplified approximate resolver that estimates height.
 * In a perfect world, we'd use font metrics.
 * For now, we use a heuristic based on character count and line height.
 */
function resolveLayout(ast, rules) {
    const resolvedSections = [];
    let currentHeight = 0;
    // Page constants (in points)
    // Letter: 8.5 x 11 inches -> 612 x 792 points
    const PAGE_HEIGHT = rules.page.size === "LETTER" ? 792 : 842; // A4 fallback
    const MARGIN_V = (rules.layout.margins.top + rules.layout.margins.bottom) * 72;
    const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN_V;
    // Heuristics
    const LINE_HEIGHT_PT = rules.typography.baseFontSize * rules.typography.lineHeight;
    const HEADER_HEIGHT_ESTIMATE = 80; // Name + contact info
    const SECTION_TITLE_HEIGHT = 25;
    const ENTRY_MARGIN = 10;
    currentHeight += HEADER_HEIGHT_ESTIMATE;
    let droppedBullets = 0;
    let droppedEntries = 0;
    // Process sections in order defined by template
    for (const sectionId of rules.layout.sectionOrder) {
        const originalSection = ast.sections.find(s => s.id === sectionId);
        if (!originalSection)
            continue;
        // Deep copy to modify
        const section = JSON.parse(JSON.stringify(originalSection));
        // Check constraints
        const maxEntries = rules.limits.maxEntriesPerSection[sectionId] || 100;
        if (section.entries.length > maxEntries) {
            droppedEntries += section.entries.length - maxEntries;
            section.entries = section.entries.slice(0, maxEntries);
        }
        currentHeight += SECTION_TITLE_HEIGHT;
        const keptEntries = [];
        for (const entry of section.entries) {
            // Estimate entry height
            // Title line
            let entryHeight = LINE_HEIGHT_PT;
            // Subheader (Company/Role)
            if (entry.company || entry.role)
                entryHeight += LINE_HEIGHT_PT;
            // Bullets
            let bullets = entry.bullets || [];
            // Constraint: Max bullets
            if (bullets.length > rules.limits.maxBulletsPerEntry) {
                droppedBullets += bullets.length - rules.limits.maxBulletsPerEntry;
                bullets = bullets.slice(0, rules.limits.maxBulletsPerEntry);
            }
            // Calculate bullet lines (very rough wrap estimate)
            // Assume avg 90 chars per line for standard width
            const CHARS_PER_LINE = 90;
            let bulletHeight = 0;
            for (const b of bullets) {
                const lines = Math.ceil(b.length / CHARS_PER_LINE);
                bulletHeight += lines * LINE_HEIGHT_PT;
            }
            entryHeight += bulletHeight;
            entryHeight += ENTRY_MARGIN;
            // Check if fits
            if (currentHeight + entryHeight > CONTENT_HEIGHT) {
                // Try to rescue by dropping bullets? 
                // For now, if an entry doesn't fit, we stop adding entries to this section or drop the rest of the section?
                // Let's just drop this entry and stop processing this section to be safe (or continue to smaller sections?)
                // "Fail fast" strategy: Drop entry.
                droppedEntries++;
                continue;
            }
            currentHeight += entryHeight;
            entry.bullets = bullets;
            keptEntries.push(entry);
        }
        section.entries = keptEntries;
        if (section.entries.length > 0) {
            resolvedSections.push(section);
        }
    }
    return {
        header: ast.header,
        sections: resolvedSections,
        meta: {
            droppedBullets,
            droppedEntries,
            pageCount: 1
        }
    };
}
