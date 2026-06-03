import { asc, eq } from "@zentro/db/drizzle";
import { members, users } from "@zentro/db/schema";

import { organizationProcedure, router } from "../trpc";

export const memberRouter = router({
  getMembers: organizationProcedure.query(async ({ ctx }) => {
    const { activeOrganization, db } = ctx;

    return db
      .select({
        id: members.id,
        role: members.role,
        userId: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(eq(members.organizationId, activeOrganization.id))
      .orderBy(asc(users.name), asc(users.email));
  }),
});
