export type InvitationType = {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationLogo: string | null;
  inviterName: string;
  role: string;
  expiresAt: Date | null;
  status: string;
  membersCount: number;
};
