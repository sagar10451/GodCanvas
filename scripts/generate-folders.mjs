/**
 * Generates folder structure in public/notes/ based on the JSON content files.
 * Run with: node scripts/generate-folders.mjs
 * 
 * Single source of truth: 
 *   src/data/think_loud.json
 *   src/data/chapter_breakdown.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const NOTES_DIR = path.join(ROOT, 'public', 'notes');

// Read JSON content files
const thinkLoud = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'think_loud.json'), 'utf-8')
);
const chapterBreakdown = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'chapter_breakdown.json'), 'utf-8')
);

function createFolders(basePath, nodes) {
  for (const node of nodes) {
    const nodePath = path.join(basePath, node.slug);
    if (!fs.existsSync(nodePath)) {
      fs.mkdirSync(nodePath, { recursive: true });
      console.log(`  Created: ${path.relative(ROOT, nodePath)}/`);
    }

    if (node.children && node.children.length > 0) {
      createFolders(nodePath, node.children);
    } else {
      // Leaf node — create .gitkeep so empty folder is tracked
      const gitkeep = path.join(nodePath, '.gitkeep');
      if (!fs.existsSync(gitkeep)) {
        fs.writeFileSync(gitkeep, '');
      }
    }
  }
}

// Ensure base directories exist
console.log('Generating folder structure from JSON files...\n');

const thinkLoudDir = path.join(NOTES_DIR, 'tech-notes');
const chapterDir = path.join(NOTES_DIR, 'flowchart-notes');

fs.mkdirSync(thinkLoudDir, { recursive: true });
fs.mkdirSync(chapterDir, { recursive: true });

console.log('Think Loud (tech-notes):');
createFolders(thinkLoudDir, thinkLoud);

console.log('\nChapter Breakdown (flowchart-notes):');
createFolders(chapterDir, chapterBreakdown);

console.log('\nDone! Place your PDFs in the generated folders.');
console.log('Example: public/notes/tech-notes/java/oop-concepts/notes.pdf');
