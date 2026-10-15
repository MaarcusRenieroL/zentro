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

export type ProjectDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  taskKeyPrefix?: string | null;
  teamName?: string | null;
  openTasks: number;
  totalTasks: number;
  totalDocs: number;
  totalMembers: number;
};
