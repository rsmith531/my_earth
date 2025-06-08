// client\components\iconography\Hamburger.tsx

import type { ComponentProps } from 'react';

function Hamburger(props: ComponentProps<'svg'>) {
  return (
    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1m0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1M3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1" />
    </svg>
  );
}

export { Hamburger };
