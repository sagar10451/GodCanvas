/**
 * Site configuration system.
 * Each portal has its own branding, watermark, and content tree.
 */

export interface SiteConfig {
  id: string;
  /** URL prefix (empty string for root portal) */
  basePath: string;
  /** Brand name displayed in header */
  brandName: string;
  /** Colored part of brand name */
  brandAccent: string;
  /** Subtitle under brand (empty string to hide) */
  brandSubtitle: string;
  /** Watermark text on canvas */
  watermark: string;
  /** YouTube channel/playlist URL */
  youtubeUrl: string;
}

export const sites: Record<string, SiteConfig> = {
  'tech-notes': {
    id: 'tech-notes',
    basePath: '/devStack',
    brandName: 'dev',
    brandAccent: 'Stack',
    brandSubtitle: 'by Sagar Kumar',
    watermark: 'DevStack by Sagar Kumar',
    youtubeUrl: 'https://youtube.com',
  },
  'flowchart-notes': {
    id: 'flowchart-notes',
    basePath: '/chapterBreakdown',
    brandName: 'Chapter',
    brandAccent: 'Breakdown',
    brandSubtitle: 'by Sagar Kumar',
    watermark: 'Chapter Breakdown by Sagar Kumar',
    youtubeUrl: 'https://youtube.com',
  },
};

/**
 * Get site config based on current URL path.
 * Returns null for root path (/) — handled by portal picker in App.tsx.
 */
export function getSiteFromPath(pathname: string): SiteConfig | null {
  if (pathname.startsWith('/chapterBreakdown')) {
    return sites['flowchart-notes'];
  }
  if (pathname.startsWith('/devStack')) {
    return sites['tech-notes'];
  }
  return null;
}

/**
 * Strip the portal base path from a URL to get the content path.
 * e.g. "/chapterBreakdown/social-science/history" → "/social-science/history"
 */
export function getContentPath(pathname: string, site: SiteConfig): string {
  if (site.basePath && pathname.startsWith(site.basePath)) {
    const rest = pathname.slice(site.basePath.length);
    return rest || '/';
  }
  return pathname;
}
