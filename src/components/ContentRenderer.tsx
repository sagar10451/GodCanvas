import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ContentBlock } from '../utils/markdownTree';

interface ContentRendererProps {
  block: ContentBlock;
}

export default function ContentRenderer({ block }: ContentRendererProps) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.raw}
      </ReactMarkdown>
    </div>
  );
}
