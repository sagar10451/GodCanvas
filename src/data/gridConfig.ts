/**
 * Grid column configuration per page path.
 * Set values on localhost via the zoom slider — they save here.
 * Production reads from this file (no slider visible).
 * 
 * Key: page path (e.g. 'root', '/java', '/java/introduction-to-java')
 * Value: number of columns (2-5)
 */

export const gridColumns: Record<string, number> = {
  'root': 5,
};

/**
 * Get the column count for a page path.
 * Falls back to 5 if not configured.
 */
export function getGridColumns(path: string): number {
  return gridColumns[path] || 5;
}
