// client\components\ui\codeblock.tsx

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Clipboard } from '@components/iconography/Clipboard';
import { useState, type ComponentProps } from 'react';
import { Default } from '@components/ui/codeblock.stories';

/**
 * Styles a string containing code and applies syntax highlighting. See the
 * {@link Default Storybook documentation} for example usage.
 * 
 * See also: {@link https://github.com/react-syntax-highlighter/react-syntax-highlighter?tab=readme-ov-file#props the `react-syntax-highlighter` documentation}.
 *
 * @param {boolean} inline Adjusts styling so that the codeblock can be rendered
 * inline with some other text. Defaults to `false`.
 * @param {boolean} enableCopy Shows the copy to clipboard button. Defaults to
 * `true`.
 * @returns
 */
function CodeBlock({
  inline = false,
  enableCopy = true,
  ...props
}: { inline?: boolean; enableCopy?: boolean } & ComponentProps<
  typeof SyntaxHighlighter
>) {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div
      className="relative max-w-full"
      style={{ display: inline ? 'inline-flex' : undefined }}
    >
      <SyntaxHighlighter
        customStyle={{
          padding: inline ? '0.25rem 0.75rem 0.25rem 0.75rem' : '1rem',
          borderRadius: '10px',
          ...props.customStyle,
          ...(enableCopy && { paddingRight: inline ? '32px' : '56px' }),
          marginBottom: 0,
          marginTop: 0,
          marginLeft: inline ? '4px' : 0,
        }}
        {...props}
        language={'typescript'}
      />
      {enableCopy && (
        <Clipboard
          className={`
        absolute 
        ${inline ? 'top-[6px]' : 'top-[16px]'} 
        ${inline ? 'right-[6px]' : 'right-[16px]'}
        ${inline ? 'size-5' : 'size-6'} 
        
        ${isClicked ? 'stroke-green-600 fill-green-600 opacity-100' : 'stroke-slate-200 fill-slate-200 opacity-20'}
        cursor-pointer 
        transition-all
        duration-300
        hover:opacity-100`}
          onClick={() =>
            navigator.clipboard
              .writeText(
                Array.isArray(props.children)
                  ? props.children.join('\n')
                  : props.children,
              )
              .then(() => {
                setIsClicked(true);

                setTimeout(() => {
                  setIsClicked(false);
                }, 2000);
              })
          }
        />
      )}
    </div>
  );
}

export { CodeBlock };
