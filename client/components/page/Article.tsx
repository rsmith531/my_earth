// components\page\Article.tsx

import { Globe } from '@components/section/Globe';
import type { ReactNode } from 'react';

/**
 * Renders page content in a styled container in front of a blurred globe as a
 * background.
 */
function Article({ children }: { children: ReactNode }) {
  return (
    <div className="relative py-4 pb-28 sm:py-12 px-4 sm:px-12 min-h-dvh h-dvh flex items-center sm:mt-0">
      <div className="z-0 inset-0 fixed pointer-events-none h-dvh">
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
        className="relative m-auto bg-slate-900/95 max-w-full sm:max-w-4xl border-slate-200 border-2 z-10 max-h-full p-4 overflow-scroll"
      >
        {children}
      </div>
    </div>
  );
}

export { Article };
