import { createAuthClient } from "better-auth/client";
import {
  emailOTPClient,
  inferAdditionalFields,
  organizationClient,
} from "better-auth/client/plugins";
import { betterAuthAc, betterAuthRoles } from "../access-control";
import { userAdditionalFields } from "../additional-fields";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    organizationClient({
      ac: betterAuthAc,
      roles: betterAuthRoles,
    }),
    inferAdditionalFields<never, { user: typeof userAdditionalFields }>({
      user: userAdditionalFields,
    }),
  ],
});
