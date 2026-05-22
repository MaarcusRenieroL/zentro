import { createAuthClient } from "better-auth/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { ac, member, owner, admin } from "../permissions";
import { userAdditionalFields } from "../additional-fields";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTHENTICATOR_URL,
  plugins: [
    emailOTPClient(),
    organizationClient({
      ac,
      roles: { owner, admin, member },
    }),
    inferAdditionalFields<never, { user: typeof userAdditionalFields }>({
      user: userAdditionalFields,
    }),
  ],
});
