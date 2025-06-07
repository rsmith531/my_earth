// components\page\Article.tsx

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Globe } from '@components/section/Globe';
import { Image } from '@components/ui/image';
import { CodeBlock } from '@components/ui/codeblock';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// TODO: make sure URLs go to the hostname of the website

/**
 * Renders a string of markdown onto a webpage. It replaces any `<img>` and
 * `<code>` with custom image and code block components to make sure they are
 * looking spiffy.
 *
 * It puts the page content into a styled container in front of a blurred globe
 * as a background.
 */
function Article({ content }: { content: string }) {
  return (
    <div className="relative py-12">
      <div className="z-0 inset-0 absolute pointer-events-none h-full">
        <Globe
          interactive={false}
          reportViewpoint={() => {}}
          freezeRender={true}
        />
      </div>
      <div
        className="absolute inset-0 z-5"
        style={{
          backdropFilter: 'blur(2px)',
        }}
      />
      <div
        style={{
          borderRadius: '15px',
          padding: '16px',
        }}
        className=" relative m-auto bg-slate-900/95 max-w-4xl border-slate-200 border-2 z-10"
      >
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            img(props) {
              const { node, ...rest } = props;
              return (
                <Image width={rest.width} height={rest.height} {...rest} />
              );
            },
            code(props) {
              const { node, ...rest } = props;
              console.log(rest.className, rest.children)
              const match = rest.className?.match(/language-(\w+)/);
              const language = match ? match[1] : null;
              if (!String(rest.children).trim().includes('\n')) {
                return (
                  <CodeBlock
                    language={language ?? 'text'}
                    style={atomDark}
                    inline
                    enableCopy={!!language}
                  >{String(rest.children).trim()}</CodeBlock>
                );
              }
              return (
                <CodeBlock
                  language={language ?? 'text'}
                  style={atomDark}
                  showLineNumbers
                  enableCopy={!!language}
                >{String(rest.children).trim()}</CodeBlock>
              );
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
}

export { Article };
