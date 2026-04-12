import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const auth = await getAuthFromCookies();
  if (auth) {
    redirect("/dashboard");
  }
  redirect("/login");
}
