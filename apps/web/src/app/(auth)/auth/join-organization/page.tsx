import { AuthHeading } from "~/src/features/auth/components/kit/auth-kit";
import { InvitedOrgsList } from "~/src/features/auth/components/join-organization/invited-orgs-list";

export default function JoinOrganizationPage() {
  return (
    <div className="flex flex-col gap-5">
      <AuthHeading
        title="Join an organization"
        description="Ask an admin for an invite code, or use the link from your invite email."
      />
      <InvitedOrgsList />
    </div>
  );
}
