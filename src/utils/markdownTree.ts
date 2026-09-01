/**
 * Parses markdown into a tree structure for progressive disclosure.
 * 
 * Tree structure:
 * - Level 1 (h1): Page title — rendered as the top heading
 * - Level 2 (h2): Top-level sections — shown as clickable cards initially
 * - Level 3 (h3): Sub-sections — revealed when parent h2 is expanded
 * - Leaf content: The actual notes (paragraphs, code, lists) — revealed point by point
 */

export interface ContentBlock {
  type: 'paragraph' | 'code' | 'list' | 'blockquote' | 'table' | 'hr';
  raw: string;
}

export interface TreeNode {
  id: string;
  level: number; // 1, 2, 3, etc.
  title: string;
  // Content directly under this heading (before any child headings)
  content: ContentBlock[];
  children: TreeNode[];
}

export interface MarkdownTree {
  title: string; // The h1 title
  introContent: ContentBlock[]; // Content between h1 and first h2
  sections: TreeNode[]; // h2-level sections
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseContentBlocks(lines: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Skip horizontal rules
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'hr', raw: '---' });
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines = [line];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        codeLines.push(lines[i]); // closing ```
        i++;
      }
      blocks.push({ type: 'code', raw: codeLines.join('\n') });
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0 && !lines[i].trim().startsWith('#')))) {
        if (lines[i].trim() === '' && i + 1 < lines.length && !lines[i + 1].trim().startsWith('>')) break;
        quoteLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'blockquote', raw: quoteLines.join('\n') });
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.includes('---')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', raw: tableLines.join('\n') });
      continue;
    }

    // List (bullet or numbered)
    if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
      const listLines = [];
      while (i < lines.length && (/^[\s]*[-*+]\s/.test(lines[i]) || /^[\s]*\d+\.\s/.test(lines[i]) || (lines[i].trim() !== '' && lines[i].startsWith('  ')))) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'list', raw: listLines.join('\n') });
      continue;
    }

    // Paragraph (anything else)
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith('>') && !/^---+$/.test(lines[i].trim()) && !(lines[i].includes('|') && i + 1 < lines.length && lines[i + 1]?.includes('---'))) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', raw: paraLines.join('\n') });
    }
  }

  return blocks;
}

export function parseMarkdownTree(markdown: string): MarkdownTree {
  const lines = markdown.split('\n');
  
  let title = '';
  const introLines: string[] = [];
  const sections: TreeNode[] = [];

  let i = 0;

  // Find h1 title
  while (i < lines.length) {
    if (lines[i].startsWith('# ') && !lines[i].startsWith('## ')) {
      title = lines[i].replace(/^#\s+/, '');
      i++;
      break;
    }
    i++;
  }

  // Collect lines between h1 and first h2
  while (i < lines.length && !lines[i].startsWith('## ')) {
    introLines.push(lines[i]);
    i++;
  }

  // Parse h2 sections
  while (i < lines.length) {
    if (lines[i].startsWith('## ')) {
      const sectionTitle = lines[i].replace(/^##\s+/, '');
      i++;

      const sectionContentLines: string[] = [];
      const children: TreeNode[] = [];

      // Collect content until next h2 or h3
      while (i < lines.length && !lines[i].startsWith('## ') && !lines[i].startsWith('### ')) {
        sectionContentLines.push(lines[i]);
        i++;
      }

      // Parse h3 children within this h2
      while (i < lines.length && lines[i].startsWith('### ')) {
        const childTitle = lines[i].replace(/^###\s+/, '');
        i++;

        const childContentLines: string[] = [];

        while (i < lines.length && !lines[i].startsWith('## ') && !lines[i].startsWith('### ')) {
          childContentLines.push(lines[i]);
          i++;
        }

        children.push({
          id: generateId(childTitle),
          level: 3,
          title: childTitle,
          content: parseContentBlocks(childContentLines),
          children: [], // We stop at h3 depth for now
        });
      }

      sections.push({
        id: generateId(sectionTitle),
        level: 2,
        title: sectionTitle,
        content: parseContentBlocks(sectionContentLines),
        children,
      });
    } else {
      i++;
    }
  }

  return {
    title,
    introContent: parseContentBlocks(introLines),
    sections,
  };
}

/**
 * Checks if a node is a "leaf" — has no children with their own content.
 * Leaf nodes show content point-by-point.
 */
export function isLeafNode(node: TreeNode): boolean {
  return node.children.length === 0;
}

/**
 * Gets total content blocks for a node (its own + children's)
 */
export function getTotalContentCount(node: TreeNode): number {
  let count = node.content.length;
  for (const child of node.children) {
    count += child.content.length;
  }
  return count;
}
