import { hasParentAccess } from "@/lib/parent-access";
import { redirect } from "next/navigation";
import { PinEntry } from "./pin-entry";

export const dynamic = "force-dynamic";

export default async function ParentAccessPage() {
  if (await hasParentAccess()) {
    redirect("/dashboard");
  }
  return <PinEntry />;
}
