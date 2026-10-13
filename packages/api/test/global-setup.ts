import { ensureTestDatabase } from "@zentro/test-utils";

export default async function setup() {
  await ensureTestDatabase();
}
