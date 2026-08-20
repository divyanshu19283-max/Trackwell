import { destroySession } from "@/lib/session";
import { apiOk } from "@/lib/utils";

export async function POST() {
  await destroySession();
  return apiOk({ success: true });
}
