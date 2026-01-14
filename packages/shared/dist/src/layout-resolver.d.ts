import { ResumeAST, TemplateRules } from "./ast";
export interface ResolvedLayout {
    header: ResumeAST["header"];
    sections: ResumeAST["sections"];
    meta: {
        droppedBullets: number;
        droppedEntries: number;
        pageCount: number;
    };
}
/**
 * A simplified approximate resolver that estimates height.
 * In a perfect world, we'd use font metrics.
 * For now, we use a heuristic based on character count and line height.
 */
export declare function resolveLayout(ast: ResumeAST, rules: TemplateRules): ResolvedLayout;
