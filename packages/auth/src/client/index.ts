import { createAuthClient } from "better-auth/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import type { auth } from "../index";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTHENTICATOR_URL,
  plugins: [
    emailOTPClient(),
    organizationClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
