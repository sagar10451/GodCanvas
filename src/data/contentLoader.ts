// Dynamic markdown content loader
// This imports all .md files from the content directory at build time
const markdownFiles = import.meta.glob('../content/**/*.md', { query: '?raw', import: 'default' });

export async function loadMarkdownContent(topicSlug: string, subtopicSlug: string): Promise<string | null> {
  const path = `../content/${topicSlug}/topics/${subtopicSlug}.md`;

  const loader = markdownFiles[path];
  if (!loader) {
    return null;
  }

  try {
    const content = await loader();
    return content as string;
  } catch (error) {
    console.error(`Failed to load content: ${path}`, error);
    return null;
  }
}
