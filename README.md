# GodCanvas

Interactive canvas-based notes platform with step-by-step animations, system design diagrams, code blocks, markdown rendering, and presentation mode.

---

## Features

### Canvas Editor (localhost only)
- **Infinite canvas** powered by tldraw — draw shapes, text, arrows, images, freehand
- **Code blocks** — syntax-highlighted with 30+ languages (Java, Python, Go, Rust, etc.) and 20 themes (One Dark, Dracula, Night Owl, VS Dark, etc.)
- **Markdown blocks** — full GFM rendering: headings, tables, lists, code, blockquotes, bold, italic, links
- **System design nodes** — drag-and-drop AWS icons (EC2, S3, Lambda, DynamoDB, SQS, etc.) from the Node Catalog
- **Animated lines** — 8 edge types (Solid, Marching, Flow, Pulse, Electric, Packet, Stream, Dash-Dot) with 4 path shapes, arrows, and 7 colors
- **Resizable nodes** — drag bottom-right corner of any diagram node

### Animation System
- **Step-by-step reveal** — add shapes to animation steps, navigate with arrow keys when locked
- **16 entrance animations** — Appear, Fade In, Fly In (4 directions), Slide In (4 directions), Zoom In/Out, Pop, Pulse, Bounce
- **5 reveal animations** — Reveal Left/Right/Top/Bottom, Reveal Center (clip-path based)
- **7 looping animations** — Float, Shake, Pulse, Bounce, Breathe, Wiggle, Sway (with adjustable speed via duration)
- **6 step actions** — Enter, Exit, Blink, Move, Teleport, Swap
- **Move** — pick destination by dragging the shape, confirm, it animates to that position
- **Swap** — one set of shapes exits while another enters simultaneously
- **Sub-topic progress tracker** — labels with step ranges, auto-cascading, draggable widget

### Presentation Mode
- **Fullscreen** with laser pointer and hand tool toggle (on header bar)
- **Laser mode** — red dot cursor with fading strokes
- **Hand mode** — pan canvas, scroll inside code/markdown blocks
- **Step navigation** with arrow keys
- **Camera auto-pans** to keep newly revealed elements visible

### Public Canvas
- **Separate canvas** for production-ready content
- **Full editor** with all features (same as main canvas)
- **Export to JSON** — download `public-canvas.json` for deployment
- **Production viewer** — read-only tldraw instance loaded from static JSON on Vercel

### Two Portals
- **`/`** — "Think Loud with Sagar Kumar" (IT/CS topics)
- **`/10`** — "Chapter Breakdown by Sagar Kumar" (School — Class 10, 12)

---

## Configuration Files

### Branding & Site Config
**File:** `src/data/siteConfig.ts`

Change brand name, subtitle, watermark, YouTube URL:
```ts
'tech-notes': {
  brandName: 'Think',
  brandAccent: 'Loud',
  brandSubtitle: 'with Sagar Kumar',
  watermark: 'Think Loud with Sagar Kumar',
  youtubeUrl: 'https://youtube.com',
}
```

### Content Tree (Topics & Subtopics)
**Files:**
- `src/data/think_loud.json` — IT/CS topics (portal `/`)
- `src/data/chapter_breakdown.json` — School topics (portal `/10`)

#### Add a new topic:
Add an entry to the JSON array:
```json
{
  "id": "docker",
  "number": 26,
  "title": "Docker",
  "description": "Containers, images, volumes, networking.",
  "slug": "docker",
  "icon": "Box",
  "color": "#2496ed",
  "children": []
}
```

#### Add subtopics under a topic:
Add entries to the `children` array:
```json
{
  "id": "docker-basics",
  "number": 1,
  "title": "Docker Basics",
  "description": "Introduction to containers.",
  "slug": "docker-basics",
  "icon": "BookOpen",
  "color": "#2496ed",
  "children": []
}
```

#### Mark a topic as "Coming Soon":
Add `"status": "coming-soon"` to any topic:
```json
{
  "id": "kubernetes",
  "title": "Kubernetes",
  "status": "coming-soon",
  ...
}
```
This shows a diagonal "In Progress" ribbon + frosted glass overlay on the card.

#### Generate folders for new topics:
After updating JSON files, run:
```bash
npm run generate-folders
```
This creates the folder structure in `public/notes/`.

### Feature Flags
**File:** `src/canvas/SubTopicTracker.tsx` (top of file)

```ts
const ENABLE_COMPLETION_SOUND = false;  // Sub-topic ding sound
const ENABLE_PARTY_POPPER = false;      // Final confetti celebration
```

### Canvas Background Color
**File:** `src/styles/index.css`

```css
.tl-background { background-color: #f0ede8 !important; }
.tl-canvas { background-color: #f0ede8 !important; }
```

### Available Lucide Icons for Topics
**File:** `src/components/TopicIcon.tsx`

Common icons: `BookOpen`, `Coffee`, `Code2`, `GitBranch`, `Brain`, `Cpu`, `Globe`, `Shield`, `Database`, `Cloud`, `Terminal`, `Workflow`, `Box`, `Network`, `Lock`, `Layers`

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `→` / `←` | Next / Previous animation step (locked canvas) |
| `Cmd+S` | Manual save |
| `Cmd+Shift+L` | Hide/show Lock button |
| `Esc` | Exit fullscreen |
| `Tab` | Insert 2 spaces (inside code/markdown editor) |

---

## How It Works

### On Localhost
1. Navigate to a leaf topic (e.g. Java → Introduction to Java)
2. **Locked mode** — step through animations with arrow keys
3. **Unlock** — full editor with all tools
4. **Toolbar buttons:** Lines, Colors, Nodes, Code, Markdown, Steps, Sub Topics, Public
5. Auto-saves to localStorage every 1.5 seconds

### On Production (Vercel)
1. Fetches `public-canvas.json` from `public/notes/{siteId}/{topic}/{subtopic}/`
2. Renders read-only tldraw with all content visible
3. Falls back to "Notes coming soon" if no JSON exists
4. YouTube buttons visible (hidden on localhost)

### Export / Import
- **Export** (↓ button) — downloads full lesson as JSON (shapes, images, steps, sub-topics, diagram data)
- **Import** (↑ button) — restores canvas from previously exported JSON
- Images are stored as base64 inside the JSON

### Public Canvas Deployment
1. Click **Public** button → switch to public canvas editor
2. Create/arrange content
3. Click **Export** → downloads `public-canvas.json`
4. Place file at: `public/notes/{siteId}/{topic}/{subtopic}/public-canvas.json`
5. Commit and deploy to Vercel

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — build tool
- **tldraw v5** — infinite canvas engine
- **@xyflow/react** — React Flow for node-based diagrams
- **@aws-icons/react** — AWS architecture icons
- **prism-react-renderer** — syntax highlighting for code blocks
- **react-markdown** + **remark-gfm** + **rehype-raw** — markdown rendering
- **Tailwind CSS 4** — styling
- **framer-motion** — card animations
- **canvas-confetti** — celebration effects
- **lucide-react** — UI icons
- **react-router-dom v7** — routing

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Generate topic folders
npm run generate-folders

# Lint
npm run lint
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on vercel.com
3. Framework: Vite (auto-detected)
4. Build command: `npm run build`
5. Output: `dist`

Create `vercel.json` in project root for SPA routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Project Structure

```
src/
  canvas/
    LessonCanvas.tsx        — Main canvas with all features
    CanvasEditor.tsx         — tldraw wrapper with custom shapes
    PublicCanvasEditor.tsx   — Public canvas editor
    PublicCanvasViewer.tsx   — Read-only viewer for production
    AnimationPanel.tsx       — Animation steps panel
    SubTopicTracker.tsx      — Sub-topic progress tracker
    DraggableWidget.tsx      — Reusable draggable wrapper
    stepAnimations.ts        — Animation execution engine
    animationEngine.ts       — Idle animation engine
    celebration.ts           — Sound + confetti effects
    types.ts                 — All TypeScript interfaces
    shapes/
      CodeBlockShape.tsx     — Custom code block shape
      MarkdownBlockShape.tsx — Custom markdown block shape
      prismLanguages.ts      — Additional Prism language grammars
    diagram/
      DiagramEditor.tsx      — React Flow canvas overlay
      DiagramToolbar.tsx     — Lines configuration toolbar
      NodeCatalog.tsx        — Draggable node shapes panel
      diagramTypes.ts        — Node/edge catalogs
      edgeTypes.tsx           — 8 animated edge types
      nodeTypes.tsx           — Custom node renderer with resize
      iconRegistry.tsx        — AWS icon mapping
      diagramStyles.css       — RF-specific styles
  components/
    Header.tsx               — App header with branding
    LaserPointer.tsx         — Laser pointer overlay
    PdfViewer.tsx            — PDF viewer (legacy)
  data/
    siteConfig.ts            — Portal branding config
    portalContext.tsx         — Portal state management
    presentationContext.tsx   — Presentation mode state
    think_loud.json          — IT/CS content tree
    chapter_breakdown.json   — School content tree
  pages/
    LessonPage.tsx           — Routes to canvas or public viewer
    PortalPage.tsx           — Card grid navigation
  styles/
    index.css                — Global styles + animations
public/
  notes/                     — Static content files (JSON, PDFs)
```
