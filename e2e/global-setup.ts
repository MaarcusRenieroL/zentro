import { ensureTestDatabase } from "../packages/test-utils/src/database";

export default async function globalSetup() {
  await ensureTestDatabase();
}
