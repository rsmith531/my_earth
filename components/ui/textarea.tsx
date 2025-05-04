import type { ComponentProps } from 'react';

import { cn } from '@lib/utils';

function Textarea({
  className,
  maxChars,
  ...props
}: ComponentProps<'textarea'> & { maxChars?: number }) {
  return (
    <>
      <textarea
        data-slot="textarea"
        className={cn(
          'border-input relative text-slate-600 placeholder:text-slate-500 placeholder:text-xl placeholder:text-center focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        {...props}
      />
      {maxChars && (
        <CharCounter
          currentChars={Number(
            typeof props.value === 'string' ? props.value?.length : 0,
          )}
          maxChars={maxChars}
        />
      )}
    </>
  );
}

function CharCounter({
  currentChars,
  maxChars,
}: { currentChars: number; maxChars: number }) {
  return (
    <div
      className={`absolute bottom-0 right-0 mr-1 px-1 mb-1 bg-input ${currentChars > maxChars ? 'text-destructive font-semibold' : 'text-slate-600'}`}
      style={{
        borderRadius: '5px 0px',
      }}
    >
      {currentChars} / {maxChars}
    </div>
  );
}

export { Textarea };
