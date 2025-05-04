import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from '@components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <>
      <Toaster richColors visibleToasts={9} />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
