import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { remarkPlugins, rehypePlugins, detectGherkinKeyword, isGherkinHeading } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function highlightGherkinLine(text: string): React.ReactNode {
  const keyword = detectGherkinKeyword(text);
  if (!keyword) return text;
  const trimmed = text.trimStart();
  const leading = text.slice(0, text.length - trimmed.length);
  const rest = trimmed.slice(keyword.length);
  return (
    <>
      {leading}
      <span className="font-semibold text-primary">{keyword}</span>
      {rest}
    </>
  );
}

function renderChildrenWithGherkin(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") return highlightGherkinLine(children);
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        return <span key={i}>{highlightGherkinLine(child)}</span>;
      }
      return child;
    });
  }
  return children;
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-6 mb-4 text-3xl font-bold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-6 mb-3 text-2xl font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : "";
    const gherkin = isGherkinHeading(text);
    return (
      <h3
        className={cn(
          "mt-5 mb-2 text-xl font-semibold tracking-tight",
          gherkin && "rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-primary",
        )}
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    const text = typeof children === "string" ? children : "";
    const gherkin = isGherkinHeading(text);
    return (
      <h4
        className={cn(
          "mt-4 mb-2 text-lg font-medium",
          gherkin && "rounded-md border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-cyan-300",
        )}
        {...props}
      >
        {children}
      </h4>
    );
  },
  p: ({ children, ...props }) => (
    <p className="mb-3 leading-relaxed" {...props}>
      {renderChildrenWithGherkin(children)}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 ml-6 list-disc" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-3 ml-6 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-sm", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="mb-4 overflow-x-auto rounded-md border bg-muted/50 p-4" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border-b px-3 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b px-3 py-2" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-4 border-l-4 border-muted pl-4 italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
};

export function MarkdownRenderer({ children }: { children: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
