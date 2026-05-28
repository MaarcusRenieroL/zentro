"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { FC, ReactNode, useState } from "react";
import superjson from "superjson";

import { makeQueryClient, TrpcProvider } from "@zentro/api/react";
import type { AppRouter } from "@zentro/api/server";

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
      <TrpcProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TrpcProvider>
    </QueryClientProvider>
  );
};
