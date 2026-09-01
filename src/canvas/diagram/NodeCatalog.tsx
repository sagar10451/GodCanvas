/**
 * NodeCatalog — draggable node shapes panel for the diagram editor.
 * Shows categorized tech logo nodes. Drag onto the canvas to add.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { NODE_CATALOG } from './diagramTypes';
import type { NodeCatalogItem } from './diagramTypes';
import { getIconComponent } from './iconRegistry';

export default function NodeCatalog() {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const onDragStart = (e: React.DragEvent, item: NodeCatalogItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Filter by search
  const filtered = search.trim()
    ? NODE_CATALOG.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.sub.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      )
    : NODE_CATALOG;

  // Group by category
  const categories: Record<string, NodeCatalogItem[]> = {};
  filtered.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });

  return (
    <div className="flex flex-col overflow-hidden max-h-[500px]">
      {/* Search */}
      <div className="px-2 py-2 border-b border-slate-700/50">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-md border border-slate-600/50">
          <Search className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs bg-transparent outline-none flex-1 text-slate-300 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {Object.keys(categories).length === 0 && (
          <p className="text-[10px] text-slate-500 text-center py-4">No matching nodes</p>
        )}

        {Object.entries(categories).map(([cat, items]) => {
          const isCollapsed = collapsedCategories.has(cat);
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-1 w-full px-1.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              >
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />
                }
                {cat}
                <span className="text-slate-600 font-normal ml-auto">{items.length}</span>
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1 pb-1">
                  {items.map(item => {
                    const IconComp = getIconComponent(item.icon);
                    return (
                      <div
                        key={`${item.category}-${item.label}`}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-grab border border-slate-700/50 hover:border-slate-500/50 hover:bg-slate-800/50 transition-all"
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        title={`${item.label} — ${item.sub}`}
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: item.bg, border: `1px solid ${item.border}` }}
                        >
                          {IconComp ? <IconComp width={20} height={20} /> : <span className="text-xs">{item.icon}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-medium text-slate-200 truncate leading-tight">{item.label}</div>
                          <div className="text-[9px] text-slate-500 truncate leading-tight">{item.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
