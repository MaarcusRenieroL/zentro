import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";

// Better Auth's own role check is intentionally wide open. Who may do what is
// decided by @zentro/permissions in our tRPC procedures, and the Better Auth
// endpoints that change data are disabled over HTTP (see `disabledPaths`), so
// they can only be reached through those procedures.
export const betterAuthAc = createAccessControl(defaultStatements);

const everything = betterAuthAc.newRole({ ...ownerAc.statements });

export const betterAuthRoles = {
  owner: everything,
  admin: everything,
  member: everything,
};
