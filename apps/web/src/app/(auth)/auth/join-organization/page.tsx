import { paths } from "~/src/lib/paths";
import Link from "next/link";
import { Users } from "lucide-react";
import { InvitedOrgsList } from "~/src/features/auth/components/join-organization/invited-orgs-list";

export default function JoinOrganizationPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl text-ink">Join an organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accept a pending invite or enter an invite code to join.
        </p>
      </div>

      <InvitedOrgsList />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to create your own workspace?{" "}
        <Link
          href={paths.auth.createOrganization()}
          className="text-primary hover:text-primary/80"
        >
          Create organization
        </Link>
      </p>
    </div>
  );
}
