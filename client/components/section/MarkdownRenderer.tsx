// client\components\section\MarkdownRenderer.tsx

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Image } from '@components/ui/image';
import { CodeBlock } from '@components/ui/codeblock';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link } from '@tanstack/react-router';

// TODO: make sure URLs go to the hostname of the website

/**
 * Renders a string of markdown into a React component. It replaces any `<img>`
 * and `<code>` with custom image and code block components to make sure they
 * are looking spiffy.
 */
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        img(props) {
          const { node, ...rest } = props;
          return <Image width={rest.width} height={rest.height} {...rest} />;
        },
        a({ node, ...rest }) {
          if (rest.href?.endsWith('.md')) {
            return (
              <Link
                // @ts-expect-error string magic that will come out with a route
                // that exists on this website in the end
                to={`/${rest.href.split('/').pop()?.replace('.md', '') || '/'}`}
              >
                {rest.children}
              </Link>
            );
          }
          return <a {...rest} />;
        },
        code(props) {
          const { node, ...rest } = props;
          const match = rest.className?.match(/language-(\w+)/);
          const language = match ? match[1] : null;
          // TODO: write tests for this
          if (!String(rest.children).trim().includes('\n')) {
            return (
              <CodeBlock
                language={language ?? 'text'}
                style={atomDark}
                inline
                enableCopy={!!language}
              >
                {String(rest.children).trim()}
              </CodeBlock>
            );
          }
          return (
            <CodeBlock
              language={language ?? 'text'}
              style={atomDark}
              showLineNumbers
              enableCopy={!!language}
            >
              {String(rest.children).trim()}
            </CodeBlock>
          );
        },
      }}
    >
      {content}
    </Markdown>
  );
}
