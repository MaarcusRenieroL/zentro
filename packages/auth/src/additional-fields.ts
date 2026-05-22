export const userAdditionalFields = {
  role: {
    type: ["member", "admin", "owner"] as string[],
    required: true,
    defaultValue: "member",
    input: false,
  },
};
