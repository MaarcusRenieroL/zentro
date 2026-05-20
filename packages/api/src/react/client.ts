"use client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../server";

const trpcContext = createTRPCContext<AppRouter>();

export const useTrpc = trpcContext.useTRPC;
export const useTrpcClient = trpcContext.useTRPCClient;
export const TrpcProvider = trpcContext.TRPCProvider;
