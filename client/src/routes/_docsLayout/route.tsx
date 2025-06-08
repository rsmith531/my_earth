// client\src\routes\_docsLayout\route.tsx

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Article } from '@components/page/Article';

export const Route = createFileRoute('/_docsLayout')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Article>
      <Outlet />
    </Article>
  );
}
