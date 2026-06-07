import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from "better-auth/plugins/organization/access";

export const statement = {
  ...defaultStatements,
  organization: ["update", "delete"],
  billing: ["manage"],
  members: ["invite", "remove", "update-role"],
  project: ["create", "update", "archive", "delete"],
  doc: ["create", "update", "delete", "restore", "comment"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  organization: ["update", "delete"],
  billing: ["manage"],
  members: ["invite", "remove", "update-role"],
  project: ["create", "update", "archive", "delete"],
  doc: ["create", "update", "delete", "restore", "comment"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  organization: ["update"],
  members: ["invite", "remove", "update-role"],
  project: ["create", "update", "archive", "delete"],
  doc: ["create", "update", "delete", "restore", "comment"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  doc: ["create", "update", "delete", "restore", "comment"],
});
