/**
 * PublicMarkdownEditor — full-page markdown editor for the public view.
 * Left: raw markdown textarea with image paste support.
 * Right: live preview with beautiful rendering.
 * Saves to localStorage, exports JSON for deployment.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Save, Download, Upload, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Highlight, themes } from 'prism-react-renderer';
import type { PublicCanvasData } from './types';

interface PublicMarkdownEditorProps {
  topicSlug: string;
  subtopicSlug: string;
  subtopicTitle: string;
  siteId: string;
  initialData: PublicCanvasData | null;
}

/** Compress an image blob to WebP and return base64 data URL */
async function compressImage(blob: Blob, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      // Try WebP first, fallback to JPEG
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.src = url;
  });
}

/** Syntax-highlighted code block for markdown preview */
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace('language-', '') || 'text';
  const code = String(children).replace(/\n$/, '');
  return (
    <Highlight theme={themes.oneDark} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{ ...style, borderRadius: 10, padding: '16px 20px', fontSize: 13, lineHeight: 1.6, overflow: 'auto', margin: '1em 0' }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span style={{ display: 'inline-block', width: 32, textAlign: 'right', paddingRight: 16, color: 'rgba(255,255,255,0.2)', userSelect: 'none', fontSize: 11 }}>
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

export default function PublicMarkdownEditor({
  topicSlug,
  subtopicSlug,
  subtopicTitle,
  siteId,
  initialData,
}: PublicMarkdownEditorProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [isSaved, setIsSaved] = useState(true);
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Build save data
  const buildSaveData = useCallback((): PublicCanvasData => ({
    version: 2,
    meta: {
      topicSlug,
      subtopicSlug,
      title: subtopicTitle,
      exportedAt: new Date().toISOString(),
    },
    content,
  }), [topicSlug, subtopicSlug, subtopicTitle, content]);

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const data = buildSaveData();
      const key = `public-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
      localStorage.setItem(key, JSON.stringify(data));
      setIsSaved(true);
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [content, siteId, topicSlug, subtopicSlug, buildSaveData]);

  // Manual save
  const handleSave = useCallback(() => {
    const data = buildSaveData();
    const key = `public-canvas-${siteId}-${topicSlug}-${subtopicSlug}`;
    localStorage.setItem(key, JSON.stringify(data));
    setIsSaved(true);
  }, [siteId, topicSlug, subtopicSlug, buildSaveData]);

  // Export — save to project folder
  const handleExport = useCallback(async () => {
    if (!content.trim()) {
      showToast('Content is empty — add markdown before exporting', 'error');
      return;
    }
    const data = buildSaveData();
    try {
      const res = await fetch('/__save-public-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, topicSlug, subtopicSlug, data }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('Saved successfully', 'success');
      } else {
        showToast('Save failed: ' + result.error, 'error');
      }
    } catch {
      showToast('Save failed — is dev server running?', 'error');
    }
  }, [content, siteId, topicSlug, subtopicSlug, buildSaveData, showToast]);

  // Publish — git push
  const handlePublish = useCallback(async () => {
    try {
      const res = await fetch('/__publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Update public notes: ${topicSlug}/${subtopicSlug}` }),
      });
      const result = await res.json();
      if (result.success) {
        if (result.message === 'No changes to publish') {
          showToast('No changes to publish — export first', 'error');
        } else {
          showToast('Pushed to GitHub — Vercel will auto-deploy', 'success');
        }
      } else {
        showToast('Push failed: ' + result.error, 'error');
      }
    } catch {
      showToast('Push failed — check SSH key and network', 'error');
    }
  }, [topicSlug, subtopicSlug, showToast]);

  // Handle paste — intercept images from clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) return;

        const dataUrl = await compressImage(blob);
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imgMarkdown = `![screenshot](${dataUrl})`;
        const newContent = content.substring(0, start) + imgMarkdown + content.substring(end);
        setContent(newContent);
        setIsSaved(false);

        // Move cursor after the inserted image
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imgMarkdown.length;
          textarea.focus();
        }, 0);
        return;
      }
    }
  }, [content]);

  // Track content changes
  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsSaved(false);
  }, []);

  const showEditor = mode === 'split' || mode === 'edit';
  const showPreview = mode === 'split' || mode === 'preview';

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-emerald-900 border-b border-emerald-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-emerald-300 text-xs font-semibold px-2 py-1 bg-emerald-800 rounded">PUBLIC</span>
          <span className="text-emerald-100 text-sm font-medium">{subtopicTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-emerald-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'edit' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'}`}
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'split' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'}`}
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${mode === 'preview' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'}`}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          </div>

          <button onClick={handleSave} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSaved ? 'bg-emerald-800 text-emerald-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
            <Save className="w-3.5 h-3.5" />{isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 text-emerald-100 hover:bg-emerald-700 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button onClick={handlePublish} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 text-blue-100 hover:bg-blue-600 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {showEditor && (
          <div className={`${showPreview ? 'w-1/2 border-r border-gray-700' : 'w-full'} flex flex-col bg-[#1e293b]`}>
            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Markdown</span>
              <span className="text-[10px] text-gray-500">{content.length} chars • Paste images with Cmd+V</span>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onPaste={handlePaste}
              spellCheck={false}
              placeholder="# Write your notes here&#10;&#10;Supports **bold**, *italic*, tables, code blocks, images (paste from clipboard), and everything markdown offers."
              className="flex-1 bg-transparent text-gray-200 p-4 outline-none resize-none font-mono text-sm leading-relaxed placeholder-gray-600"
              style={{ tabSize: 2 }}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  handleContentChange(content.substring(0, start) + '  ' + content.substring(end));
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  }, 0);
                }
              }}
            />
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className={`${showEditor ? 'w-1/2' : 'w-full'} overflow-y-auto bg-white`}>
            <div className="max-w-[800px] mx-auto px-8 py-8">
              {content ? (
                <div className="public-md-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ className, children, ...props }) {
                        const isBlock = className?.startsWith('language-');
                        if (isBlock) {
                          return <CodeBlock className={className}>{String(children)}</CodeBlock>;
                        }
                        return <code className="inline-code" {...props}>{children}</code>;
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-20">Preview will appear here</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[99999] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-600/90 text-white border border-emerald-400/30'
            : 'bg-red-600/90 text-white border border-red-400/30'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}
    </div>
  );
}
