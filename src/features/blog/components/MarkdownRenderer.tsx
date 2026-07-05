import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => (
  <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-blockquote:border-primary prose-code:text-primary prose-img:rounded-lg prose-img:border prose-img:border-border">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownRenderer;
