import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { ContentBlock } from '../utils/markdownTree';
import ContentRenderer from './ContentRenderer';

interface LeafContentRevealProps {
  content: ContentBlock[];
  expandAll: boolean;
}

/**
 * Reveals content blocks one at a time with arrow navigation.
 * First block is always visible. Each arrow click reveals the next block.
 */
export default function LeafContentReveal({ content, expandAll }: LeafContentRevealProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  // Reset when content changes
  useEffect(() => {
    setVisibleCount(expandAll ? content.length : 1);
  }, [expandAll, content.length]);

  const showNext = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 1, content.length));
  }, [content.length]);

  const showPrev = useCallback(() => {
    setVisibleCount(prev => Math.max(prev - 1, 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (expandAll) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        showNext();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandAll, showNext, showPrev]);

  if (content.length === 0) return null;

  const allVisible = visibleCount >= content.length;

  return (
    <div className="mt-3">
      <AnimatePresence mode="sync">
        {content.slice(0, visibleCount).map((block, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mb-1"
          >
            <ContentRenderer block={block} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Navigation controls — only show when not in expand-all mode */}
      {!expandAll && content.length > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {visibleCount} / {content.length} blocks
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={showPrev}
              disabled={visibleCount <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Show previous"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button
              onClick={showNext}
              disabled={allVisible}
              className="p-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Show next"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
