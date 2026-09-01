import type { ContentNode } from './contentTree';
import chapterBreakdownData from './chapter_breakdown.json';

/**
 * Chapter Breakdown content — derived entirely from chapter_breakdown.json
 */
export const flowchartContent: ContentNode[] = chapterBreakdownData as ContentNode[];
