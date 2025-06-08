// client\src\routes\__root.tsx

import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@components/ui/sonner';
import type { QueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';
import { Button } from '@components/ui/button';
import { Hamburger } from '@components/iconography/Hamburger';

// TODO: add error boundary
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <>
        <Toaster richColors visibleToasts={9} />
        <Outlet />
        <ReactQueryDevtools buttonPosition="bottom-left" />
        <TanStackRouterDevtools position="bottom-right" />
        <div className="fixed top-4 right-4 z-20">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Hamburger className="fill-slate-200 stroke-slate-200" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900" align="end">
              <DropdownMenuGroup>
                <Link to="/">
                  <DropdownMenuItem className="cursor-pointer">
                    Home
                  </DropdownMenuItem>
                </Link>
                <Link to="/about">
                  <DropdownMenuItem className="cursor-pointer">
                    About
                  </DropdownMenuItem>
                </Link>
                <Link to="/content_policy">
                  <DropdownMenuItem className="cursor-pointer">
                    Content Policy
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled>For developers</DropdownMenuItem>
                <Link to="/technical_implementation">
                  <DropdownMenuItem className="cursor-pointer">
                    Technical Implementation
                  </DropdownMenuItem>
                </Link>
                <Link to="/contributing">
                  <DropdownMenuItem className="cursor-pointer">
                    Contributing
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
    ),
  },
);
