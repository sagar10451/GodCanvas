import { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteFromPath, getContentPath } from './siteConfig';
import type { SiteConfig } from './siteConfig';
import type { ContentNode } from './contentTree';
import { techContent } from './techContent';
import { flowchartContent } from './flowchartContent';

interface PortalContextValue {
  site: SiteConfig | null;
  content: ContentNode[];
  /** The path within the portal (basePath stripped) */
  contentPath: string;
  /** Slug segments of the content path */
  slugs: string[];
}

const PortalContext = createContext<PortalContextValue>({
  site: null,
  content: [],
  contentPath: '/',
  slugs: [],
});

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const site = getSiteFromPath(location.pathname);

  if (!site) {
    // Root path — no portal selected
    return (
      <PortalContext.Provider value={{ site: null, content: [], contentPath: '/', slugs: [] }}>
        {children}
      </PortalContext.Provider>
    );
  }

  const contentPath = getContentPath(location.pathname, site);
  const slugs = contentPath.split('/').filter(Boolean);
  const content = site.id === 'flowchart-notes' ? flowchartContent : techContent;

  return (
    <PortalContext.Provider value={{ site, content, contentPath, slugs }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  return useContext(PortalContext);
}

/** Use inside portal pages where site is guaranteed to be non-null */
export function usePortalSafe() {
  const ctx = useContext(PortalContext);
  return ctx as { site: SiteConfig; content: ContentNode[]; contentPath: string; slugs: string[] };
}
