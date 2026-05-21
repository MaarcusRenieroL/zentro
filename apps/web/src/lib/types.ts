export type Member = {
  organizationId: string;
  userId: string;
  role: "member" | "admin" | "owner";
  createdAt: Date;
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | undefined;
  };
};
