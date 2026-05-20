"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { FC, ReactNode, useState } from "react";
import superjson from "superjson";

import { makeQueryClient } from "@zentro/api";
import type { AppRouter } from "@zentro/api";

const { TRPCProvider } = createTRPCContext<AppRouter>();

type Props = {
  children: ReactNode;
};

export const AppTRPCProvider: FC<Props> = ({ children }) => {
  const [queryClient] = useState(() => makeQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};
